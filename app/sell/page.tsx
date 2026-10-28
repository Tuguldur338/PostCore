"use client";

import Image from "next/image";
import Link from "next/link";
import {
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
  type FormEvent,
  type ReactNode,
} from "react";
import { useAuth } from "@/components/auth-provider";
import { formatMntPrice, parseMntAmount } from "@/components/currency";
import {
  Alert,
  ArrowRight,
  Camera,
  CheckCircle,
  ImagePlus,
  Lock,
  Spinner,
  Store,
  Tag,
  Trash,
} from "@/components/icons";
import { PageHeader } from "@/components/page-header";
import { PageShell } from "@/components/page-shell";
import { maxProductImageDataUrlLength } from "@/components/product-image";
import { categorySuggestions, getCategoryArt, getPickupLabel } from "@/lib/catalog";
import type { Product } from "@/components/types";

type ProductFormState = {
  name: string;
  price: string;
  quantity: string;
  description: string;
  category: string;
  fitsFor: string;
  image: string;
  pickupClass: string;
  pickupRoom: string;
  pickupMethod: string;
};

type Feedback = {
  tone: "info" | "success" | "error";
  message: string;
};

const maxImageDimension = 1600;

const emptyProductForm: ProductFormState = {
  name: "",
  price: "",
  quantity: "1",
  description: "",
  category: "",
  fitsFor: "",
  image: "",
  pickupClass: "",
  pickupRoom: "",
  pickupMethod: "",
};

function compressImage(source: Blob | string): Promise<string> {
  return new Promise((resolve, reject) => {
    const shouldRevokeUrl = typeof source !== "string";
    const imageSource = typeof source === "string" ? source : URL.createObjectURL(source);
    const image = new window.Image();

    const releaseSource = () => {
      if (shouldRevokeUrl) URL.revokeObjectURL(imageSource);
    };

    image.onload = () => {
      try {
        const largestDimension = Math.max(image.naturalWidth, image.naturalHeight);
        let scale = Math.min(1, maxImageDimension / largestDimension);
        let compressedImage = "";

        for (let resizeAttempt = 0; resizeAttempt < 4; resizeAttempt += 1) {
          const canvas = document.createElement("canvas");
          canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
          canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));

          const context = canvas.getContext("2d");
          if (!context) throw new Error("Image compression is unavailable.");
          context.drawImage(image, 0, 0, canvas.width, canvas.height);

          for (const quality of [0.86, 0.78, 0.7, 0.62, 0.54]) {
            compressedImage = canvas.toDataURL("image/webp", quality);
            if (compressedImage.length <= maxProductImageDataUrlLength) {
              resolve(compressedImage);
              return;
            }
          }

          scale *= 0.85;
        }

        throw new Error("Image is too large to store.");
      } catch (error) {
        reject(error);
      } finally {
        releaseSource();
      }
    };

    image.onerror = () => {
      releaseSource();
      reject(new Error("This image could not be processed."));
    };
    image.src = imageSource;
  });
}

export default function SellPage() {
  const { user, isReady } = useAuth();
  const [productForm, setProductForm] = useState<ProductFormState>(emptyProductForm);
  const [feedback, setFeedback] = useState<Feedback>({ tone: "info", message: "" });
  const [isAdmin, setIsAdmin] = useState(false);
  const [isSessionReady, setIsSessionReady] = useState(false);
  const [isCompressingImage, setIsCompressingImage] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [savedProduct, setSavedProduct] = useState<{ name: string } | null>(null);
  const isSubmitting = useRef(false);
  const pendingProductId = useRef<string | null>(null);

  useEffect(() => {
    let isActive = true;
    const verifyAdmin = async () => {
      try {
        const response = await fetch("/api/admin/products", { cache: "no-store" });
        const result = (await response.json()) as {
          message?: string;
          authorized?: boolean;
        };
        if (!response.ok || result.authorized !== true) {
          if (isActive && response.status !== 401 && response.status !== 403) {
            setFeedback({
              tone: "error",
              message: result.message ?? "Seller access could not be checked.",
            });
          }
          return;
        }
        if (isActive) setIsAdmin(true);
      } catch (error) {
        if (isActive) {
          setFeedback({
            tone: "error",
            message:
              error instanceof Error
                ? error.message
                : "Seller access could not be checked.",
          });
        }
      } finally {
        if (isActive) setIsSessionReady(true);
      }
    };

    void verifyAdmin();
    return () => {
      isActive = false;
    };
  }, []);

  const handleInputChange = (field: keyof ProductFormState, value: string) => {
    if (!isSubmitting.current) pendingProductId.current = null;
    setProductForm((previous) => ({ ...previous, [field]: value }));
  };

  const handleImageSelect = async (event: ChangeEvent<HTMLInputElement>) => {
    if (!isSubmitting.current) pendingProductId.current = null;
    const file = event.target.files?.[0];
    if (!file) {
      setProductForm((previous) => ({ ...previous, image: "" }));
      return;
    }

    setIsCompressingImage(true);
    setFeedback({ tone: "info", message: "Optimising your photo…" });
    try {
      const imageData = await compressImage(file);
      setProductForm((previous) => ({ ...previous, image: imageData }));
      setFeedback({ tone: "success", message: "Photo ready to add." });
    } catch {
      setProductForm((previous) => ({ ...previous, image: "" }));
      setFeedback({
        tone: "error",
        message: "This photo could not be optimised. Try a JPG or PNG under 10 MB.",
      });
    } finally {
      setIsCompressingImage(false);
    }
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isSubmitting.current) return;

    if (!isAdmin) {
      setFeedback({
        tone: "error",
        message: "Sign in with a marketplace admin account before adding listings.",
      });
      return;
    }

    const priceAmount = parseMntAmount(productForm.price);
    if (!productForm.name.trim() || !Number.isSafeInteger(priceAmount) || priceAmount <= 0) {
      setFeedback({
        tone: "error",
        message: "Add an item name and a valid whole price in ₮ (for example 12,990).",
      });
      return;
    }

    const quantity = Number(productForm.quantity);
    if (!Number.isSafeInteger(quantity) || quantity < 1) {
      setFeedback({
        tone: "error",
        message: "Enter how many items you have to sell (1 or more).",
      });
      return;
    }

    if (!productForm.image) {
      setFeedback({
        tone: "error",
        message: "Add a product photo so buyers know what they are requesting.",
      });
      return;
    }

    isSubmitting.current = true;
    setIsSaving(true);
    setFeedback({ tone: "info", message: "Saving the listing…" });
    if (pendingProductId.current === null) {
      pendingProductId.current = crypto.randomUUID();
    }

    const newProduct: Product = {
      id: pendingProductId.current,
      name: productForm.name.trim(),
      price: String(priceAmount),
      badge: "New",
      description:
        productForm.description.trim() || "A fresh campus find ready for a new home.",
      image: productForm.image,
      category: productForm.category.trim() || "School Supplies",
      fitsFor: productForm.fitsFor.trim() || "Campus life",
      pickupClass: productForm.pickupClass.trim(),
      pickupRoom: productForm.pickupRoom.trim(),
      pickupMethod: productForm.pickupMethod.trim(),
      quantity,
    };

    try {
      const response = await fetch("/api/admin/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newProduct),
      });
      const result = (await response.json()) as { message?: string };
      if (!response.ok) {
        throw new Error(result.message ?? "The listing could not be saved.");
      }
      pendingProductId.current = null;
      setSavedProduct({ name: newProduct.name });
      setProductForm(emptyProductForm);
      setFeedback({
        tone: "success",
        message: `${newProduct.name} is now on the shelf.`,
      });
    } catch (error) {
      setFeedback({
        tone: "error",
        message:
          error instanceof Error
            ? error.message
            : "The listing could not be saved. Try a smaller photo.",
      });
    } finally {
      isSubmitting.current = false;
      setIsSaving(false);
    }
  };

  const previewProduct: Product = {
    id: "preview",
    name: productForm.name.trim() || "Your listing title",
    price: productForm.price || "0",
    badge: "New",
    description:
      productForm.description.trim() || "A short, friendly description will appear here.",
    image: productForm.image,
    category: productForm.category.trim() || "School Supplies",
    fitsFor: productForm.fitsFor.trim() || "Campus life",
    pickupClass: productForm.pickupClass.trim(),
    pickupRoom: productForm.pickupRoom.trim(),
    pickupMethod: productForm.pickupMethod.trim(),
    quantity: Number.isSafeInteger(Number(productForm.quantity))
      ? Number(productForm.quantity)
      : undefined,
  };

  return (
    <PageShell>
      <PageHeader
        eyebrow="Seller tools"
        title={
          <>
            Put something on the <span className="display-italic">shelf.</span>
          </>
        }
        description="Add a listing with a clear photo, an honest description, and the pickup details buyers need. Listings are limited to marketplace admins so the shop stays trustworthy."
        actions={
          <>
            <Link href="/products" className="btn btn-secondary">
              View listings
              <ArrowRight size={15} className="arrow-slide" />
            </Link>
            <Link href="/orders" className="btn btn-ghost">
              Order desk
            </Link>
          </>
        }
      />

      {feedback.message ? (
        <p
          role={feedback.tone === "error" ? "alert" : "status"}
          className={`flex items-start gap-2 rounded-xl border px-4 py-3 text-sm ${
            feedback.tone === "error"
              ? "border-rose/25 bg-rose-soft text-rose"
              : feedback.tone === "success"
                ? "border-pine/20 bg-pine-soft text-pine"
                : "border-line bg-surface-2 text-ink-soft"
          }`}
        >
          {feedback.tone === "error" ? (
            <Alert size={16} className="mt-0.5 shrink-0" />
          ) : feedback.tone === "success" ? (
            <CheckCircle size={16} className="mt-0.5 shrink-0" />
          ) : (
            <Spinner size={15} className="mt-0.5 shrink-0" />
          )}
          {feedback.message}
        </p>
      ) : null}

      {!isSessionReady || !isReady ? (
        <div className="grid gap-3 lg:grid-cols-2">
          <div className="skeleton h-8 w-1/3 rounded-full" />
          <div className="skeleton h-64 rounded-2xl" />
          <div className="skeleton h-64 rounded-2xl" />
        </div>
      ) : !isAdmin ? (
        <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="rounded-2xl border border-line bg-surface p-6 sm:p-9">
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-gold-soft text-[#7a5412]">
              <Lock size={22} />
            </span>
            <h2 className="mt-5 font-display text-3xl tracking-[-0.025em] text-ink">
              Seller access is by invitation.
            </h2>
            <p className="mt-3 max-w-md text-sm leading-6 text-muted">
              Listings are managed by marketplace admins so every item has a
              photo, a fair price, and clear pickup details. Students can still
              browse, save, and request anything on the market.
            </p>
            <div className="mt-6 flex flex-wrap gap-2">
              {user ? (
                <Link href="/account" className="btn btn-primary">
                  View my account
                  <ArrowRight size={15} />
                </Link>
              ) : (
                <Link href="/signin?next=/sell" className="btn btn-primary">
                  Sign in
                  <ArrowRight size={15} />
                </Link>
              )}
              <Link href="/contacts" className="btn btn-secondary">
                Ask about selling
              </Link>
            </div>
          </div>
          <div className="rounded-2xl border border-line bg-paper-deep p-6 sm:p-8">
            <p className="eyebrow">What admins handle</p>
            <ul className="mt-5 space-y-4">
              <li className="flex items-start gap-3">
                <Camera size={18} className="mt-0.5 text-pine" />
                <p className="text-sm leading-6 text-ink-soft">
                  Clear photos and honest descriptions.
                </p>
              </li>
              <li className="flex items-start gap-3">
                <Tag size={18} className="mt-0.5 text-pine" />
                <p className="text-sm leading-6 text-ink-soft">
                  Fair prices and accurate stock counts.
                </p>
              </li>
              <li className="flex items-start gap-3">
                <Store size={18} className="mt-0.5 text-pine" />
                <p className="text-sm leading-6 text-ink-soft">
                  Pickup details that stay on campus.
                </p>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle size={18} className="mt-0.5 text-pine" />
                <p className="text-sm leading-6 text-ink-soft">
                  Stock is checked and reduced automatically.
                </p>
              </li>
            </ul>
            <p className="mt-6 border-t border-line pt-4 text-[0.7rem] leading-5 text-muted">
              Want to join the seller team? Ask a marketplace admin.
            </p>
          </div>
        </div>
      ) : savedProduct ? (
        <div className="rounded-2xl border border-pine/20 bg-pine-soft p-8 text-center sm:p-12">
          <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-pine text-on-pine">
            <CheckCircle size={30} />
          </span>
          <h2 className="mt-5 font-display text-3xl tracking-[-0.025em] text-pine">
            {savedProduct.name} is live.
          </h2>
          <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-pine/80">
            It is on the market now. Buyers can view it, save it, and send a
            request whenever they are ready.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-2">
            <Link href="/products" className="btn btn-primary">
              View the market
              <ArrowRight size={15} />
            </Link>
            <button
              type="button"
              onClick={() => {
                setSavedProduct(null);
                setFeedback({ tone: "info", message: "" });
              }}
              className="btn btn-secondary"
            >
              Add another listing
            </button>
          </div>
        </div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-start">
          <form onSubmit={handleSubmit} className="space-y-5">
            <fieldset disabled={isSaving} className="space-y-5">
              <FormSection number="01" title="The basics" description="What is it, and why would someone want it?">
                <div>
                  <label className="field-label" htmlFor="listing-name">
                    Listing title
                  </label>
                  <input
                    id="listing-name"
                    value={productForm.name}
                    onChange={(event) => handleInputChange("name", event.target.value)}
                    className="field"
                    placeholder="e.g. A5 dotted notebook, barely used"
                    maxLength={200}
                  />
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="field-label" htmlFor="listing-category">
                      Category
                    </label>
                    <input
                      id="listing-category"
                      value={productForm.category}
                      onChange={(event) => handleInputChange("category", event.target.value)}
                      className="field"
                      placeholder="School Supplies"
                      list="category-suggestions"
                      maxLength={80}
                    />
                    <datalist id="category-suggestions">
                      {categorySuggestions.map((category) => (
                        <option key={category} value={category} />
                      ))}
                    </datalist>
                  </div>
                  <div>
                    <label className="field-label" htmlFor="listing-fits">
                      Good for
                    </label>
                    <input
                      id="listing-fits"
                      value={productForm.fitsFor}
                      onChange={(event) => handleInputChange("fitsFor", event.target.value)}
                      className="field"
                      placeholder="Class notes / exam week"
                      maxLength={200}
                    />
                  </div>
                </div>

                <div>
                  <label className="field-label" htmlFor="listing-description">
                    Description
                  </label>
                  <textarea
                    id="listing-description"
                    value={productForm.description}
                    onChange={(event) => handleInputChange("description", event.target.value)}
                    className="field min-h-28 resize-y"
                    placeholder="Condition, what is included, and anything a buyer should know."
                    maxLength={2000}
                  />
                  <p className="mt-1 text-right text-[0.68rem] text-muted">
                    {productForm.description.length}/2000
                  </p>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="field-label" htmlFor="listing-price">
                      Price (₮)
                    </label>
                    <div className="relative">
                      <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 font-display text-lg text-muted">
                        ₮
                      </span>
                      <input
                        id="listing-price"
                        value={productForm.price}
                        onChange={(event) =>
                          handleInputChange("price", event.target.value.replace(/[^\d]/g, ""))
                        }
                        inputMode="numeric"
                        className="field pl-8"
                        placeholder="12990"
                        maxLength={12}
                      />
                    </div>
                    <p className="mt-1 text-[0.68rem] text-muted">
                      {formatMntPrice(productForm.price || "0")} — whole tugrik only.
                    </p>
                  </div>
                  <div>
                    <label className="field-label" htmlFor="listing-quantity">
                      How many?
                    </label>
                    <input
                      id="listing-quantity"
                      value={productForm.quantity}
                      onChange={(event) =>
                        handleInputChange("quantity", event.target.value.replace(/[^\d]/g, ""))
                      }
                      inputMode="numeric"
                      className="field"
                      placeholder="1"
                      maxLength={9}
                    />
                    <p className="mt-1 text-[0.68rem] text-muted">
                      Stock drops automatically when a request is placed.
                    </p>
                  </div>
                </div>
              </FormSection>

              <FormSection number="02" title="A clear photo" description="Natural light and a plain background go a long way.">
                <input
                  id="listing-image"
                  type="file"
                  accept="image/*"
                  onChange={handleImageSelect}
                  className="sr-only"
                  disabled={isCompressingImage || isSaving}
                />
                {productForm.image ? (
                  <div className="relative overflow-hidden rounded-2xl border border-line bg-surface-2">
                    <div className="relative aspect-[16/9]">
                      <Image
                        src={productForm.image}
                        alt="Listing preview"
                        fill
                        unoptimized
                        className="object-cover"
                      />
                    </div>
                    <div className="absolute right-3 top-3 flex gap-1.5">
                      <label
                        htmlFor="listing-image"
                        className="flex h-9 cursor-pointer items-center gap-1.5 rounded-full bg-surface/95 px-3 text-[0.72rem] font-semibold text-ink shadow-sm backdrop-blur transition-colors hover:bg-surface"
                      >
                        <ImagePlus size={14} />
                        Replace
                      </label>
                      <button
                        type="button"
                        onClick={() => handleInputChange("image", "")}
                        className="flex h-9 w-9 items-center justify-center rounded-full bg-surface/95 text-muted shadow-sm backdrop-blur transition-colors hover:text-rose"
                        aria-label="Remove photo"
                      >
                        <Trash size={14} />
                      </button>
                    </div>
                  </div>
                ) : (
                  <label
                    htmlFor="listing-image"
                    className={`flex cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed border-line-strong bg-surface-2/50 px-4 py-12 text-center transition-colors hover:border-accent hover:bg-accent-soft/30 ${
                      isCompressingImage ? "pointer-events-none opacity-60" : ""
                    }`}
                  >
                    <span className="flex h-12 w-12 items-center justify-center rounded-full bg-surface text-ink-soft shadow-[var(--shadow-sm)]">
                      {isCompressingImage ? <Spinner size={22} /> : <Camera size={22} />}
                    </span>
                    <span className="mt-3 text-sm font-semibold text-ink">
                      {isCompressingImage ? "Optimising photo…" : "Upload a product photo"}
                    </span>
                    <span className="mt-1 text-[0.72rem] text-muted">
                      JPG, PNG, or WebP. Large photos are optimised automatically.
                    </span>
                  </label>
                )}
              </FormSection>

              <FormSection number="03" title="Pickup details" description="Keep it on campus. Never add a home address.">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="field-label" htmlFor="pickup-class">
                      Class (optional)
                    </label>
                    <input
                      id="pickup-class"
                      value={productForm.pickupClass}
                      onChange={(event) => handleInputChange("pickupClass", event.target.value)}
                      className="field"
                      placeholder="10B"
                      pattern="\s*(?:[1-9]|1[0-2])[A-Da-d]\s*"
                      title="Enter a class from 1A to 12D, such as 10B."
                    />
                  </div>
                  <div>
                    <label className="field-label" htmlFor="pickup-room">
                      Room (optional)
                    </label>
                    <input
                      id="pickup-room"
                      value={productForm.pickupRoom}
                      onChange={(event) => handleInputChange("pickupRoom", event.target.value)}
                      className="field"
                      placeholder="Room 204"
                      maxLength={100}
                    />
                  </div>
                </div>
                <div>
                  <label className="field-label" htmlFor="pickup-method">
                    Where or how to meet (optional)
                  </label>
                  <input
                    id="pickup-method"
                    value={productForm.pickupMethod}
                    onChange={(event) => handleInputChange("pickupMethod", event.target.value)}
                    className="field"
                    placeholder="After 4th period by the library"
                    maxLength={160}
                  />
                </div>
                <p className="flex items-start gap-2 rounded-xl border border-line bg-surface-2 px-3.5 py-2.5 text-[0.72rem] leading-5 text-muted">
                  <Lock size={13} className="mt-0.5 shrink-0 text-pine" />
                  These details are shown to buyers so they know where to collect.
                  Do not enter a home address or other private location.
                </p>
              </FormSection>

              <div className="flex flex-col-reverse gap-3 border-t border-line pt-5 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-[0.72rem] leading-5 text-muted">
                  The listing is public the moment you add it. You can change stock
                  or remove it from the products page.
                </p>
                <button
                  type="submit"
                  disabled={isCompressingImage || isSaving}
                  className="btn btn-primary btn-lg shrink-0"
                >
                  {isSaving ? (
                    <>
                      <Spinner size={17} />
                      Adding listing…
                    </>
                  ) : (
                    <>
                      Add to the market
                      <ArrowRight size={16} className="arrow-slide" />
                    </>
                  )}
                </button>
              </div>
            </fieldset>
          </form>

          <aside className="space-y-4 lg:sticky lg:top-[calc(var(--header-height)+1rem)]">
            <div className="overflow-hidden rounded-2xl border border-line bg-surface shadow-[var(--shadow-sm)]">
              <div className="flex items-center justify-between border-b border-line px-4 py-3">
                <p className="font-mono text-[0.6rem] font-semibold uppercase tracking-[0.16em] text-muted">
                  Live preview
                </p>
                <span className="chip chip-accent border-transparent">New</span>
              </div>
              <div className="product-media">
                {productForm.image ? (
                  <Image
                    src={productForm.image}
                    alt=""
                    fill
                    unoptimized
                    className="object-cover"
                  />
                ) : (
                  <Image
                    src={getCategoryArt(previewProduct.category)}
                    alt=""
                    fill
                    unoptimized
                    className="object-cover opacity-70"
                  />
                )}
              </div>
              <div className="p-4">
                <p className="font-mono text-[0.58rem] font-semibold uppercase tracking-[0.14em] text-muted">
                  {previewProduct.category}
                </p>
                <p className="product-title mt-1.5 text-[1.15rem] text-ink">
                  {previewProduct.name}
                </p>
                <p className="mt-1 line-clamp-2 text-[0.8rem] leading-5 text-muted">
                  {previewProduct.description}
                </p>
                <p className="mt-2 flex items-center gap-1.5 text-[0.7rem] text-muted">
                  <Store size={13} className="text-pine" />
                  {getPickupLabel(previewProduct)}
                </p>
                <div className="mt-3 flex items-end justify-between border-t border-line pt-3">
                  <p className="price text-xl text-ink">
                    {formatMntPrice(previewProduct.price)}
                  </p>
                  <span className="text-[0.66rem] text-muted">
                    {previewProduct.quantity === undefined
                      ? "Stock"
                      : `${previewProduct.quantity} in stock`}
                  </span>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-line bg-paper-deep p-4">
              <p className="text-[0.72rem] font-semibold text-ink">Good listings sell faster</p>
              <ul className="mt-2.5 space-y-2 text-[0.72rem] leading-5 text-muted">
                <li className="flex gap-2">
                  <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-accent" />
                  Say what is included and any wear.
                </li>
                <li className="flex gap-2">
                  <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-accent" />
                  Use a photo taken in daylight.
                </li>
                <li className="flex gap-2">
                  <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-accent" />
                  Price it for a student budget.
                </li>
              </ul>
            </div>
          </aside>
        </div>
      )}
    </PageShell>
  );
}

function FormSection({
  number,
  title,
  description,
  children,
}: {
  number: string;
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-line bg-surface p-5 sm:p-7">
      <div className="flex items-start gap-3">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-surface-2 font-mono text-[0.68rem] font-bold text-muted">
          {number}
        </span>
        <div>
          <h2 className="font-display text-xl tracking-tight text-ink">{title}</h2>
          <p className="mt-0.5 text-[0.76rem] leading-5 text-muted">{description}</p>
        </div>
      </div>
      <div className="mt-5 space-y-4">{children}</div>
    </section>
  );
}
