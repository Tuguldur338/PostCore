import { CheckCircle, Lock, MapPin, Users } from "@/components/icons";

const items = [
  {
    icon: Users,
    title: "School-first",
    description: "Listings are for Orkhon School students and campus life.",
  },
  {
    icon: Lock,
    title: "No online payment",
    description: "Nothing is charged on the site — request now, sort it out on campus.",
  },
  {
    icon: MapPin,
    title: "Real pickup details",
    description: "Each listing can show the class, room, or meet-up plan.",
  },
  {
    icon: CheckCircle,
    title: "Checked by students",
    description: "Marketplace admins review requests and keep the shelves tidy.",
  },
];

export function TrustStrip() {
  return (
    <section
      className="grid gap-px overflow-hidden rounded-2xl border border-line bg-line sm:grid-cols-2 lg:grid-cols-4"
      aria-label="How PostCore keeps things simple"
    >
      {items.map((item) => {
        const Icon = item.icon;
        return (
          <div key={item.title} className="bg-surface p-5">
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-pine-soft text-pine">
              <Icon size={17} />
            </span>
            <h3 className="mt-3.5 text-sm font-semibold text-ink">{item.title}</h3>
            <p className="mt-1.5 text-[0.76rem] leading-5 text-muted">
              {item.description}
            </p>
          </div>
        );
      })}
    </section>
  );
}
