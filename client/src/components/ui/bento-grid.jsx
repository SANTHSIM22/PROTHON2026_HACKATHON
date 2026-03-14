import { ArrowRightIcon } from "@radix-ui/react-icons";
import { cn } from "../../lib/utils";
import { Button } from "./button";

const BentoGrid = ({ children, className }) => {
  return (
    <div
      className={cn(
        "grid w-full auto-rows-[22rem] grid-cols-3 gap-4",
        className
      )}
    >
      {children}
    </div>
  );
};

const BentoCard = ({
  name,
  className,
  background,
  Icon,
  description,
  href,
  cta,
}) => (
  <div
    key={name}
    className={cn(
      "group relative col-span-3 flex flex-col justify-end overflow-hidden rounded-xl",
      "transform-gpu bg-white border border-[#D4E0DA] shadow-sm",
      "hover:shadow-lg hover:border-[#B45309]/20 transition-all duration-500",
      className
    )}
  >
    {/* Background illustration */}
    <div className="absolute inset-0 z-0">{background}</div>

    {/* 
      Bottom gradient for text readability
      - Always present at ~40 % so text is readable
      - On hover ramps to fully opaque white so the 
        now-100 %-visible background doesn't drown the text
    */}
    <div
      className={cn(
        "absolute inset-x-0 bottom-0 z-[1] pointer-events-none",
        "transition-all duration-500",
        // default: gentle fade
        "h-[65%]",
        "bg-gradient-to-t from-white via-white/80 to-transparent",
        // hover: stronger, taller
        "group-hover:h-[70%]",
        "group-hover:from-white group-hover:via-white/[0.97] group-hover:to-transparent"
      )}
    />

    {/* Content — pinned to bottom, shifts up on hover for CTA */}
    <div className="relative z-10 p-6 pb-5 flex flex-col gap-1 transition-all duration-300 group-hover:-translate-y-8">
      <Icon className="h-10 w-10 origin-left transform-gpu text-[#B45309] transition-all duration-300 ease-in-out group-hover:scale-75" />
      <h3 className="text-lg font-semibold text-[#0C1A15] font-syne mt-1">
        {name}
      </h3>
      <p className="text-sm text-[#3D5249] font-sans leading-relaxed">
        {description}
      </p>
    </div>

    {/* CTA — slides up on hover */}
    <div
      className={cn(
        "absolute bottom-0 left-0 right-0 z-20 flex items-center p-4 pt-0",
        "translate-y-10 opacity-0 pointer-events-none",
        "transition-all duration-300",
        "group-hover:translate-y-0 group-hover:opacity-100 group-hover:pointer-events-auto"
      )}
    >
      <Button
        variant="ghost"
        asChild
        size="sm"
        className="text-[#B45309] hover:text-[#D97706] hover:bg-[#FEF3C7]/60 font-semibold"
      >
        <a href={href}>
          {cta}
          <ArrowRightIcon className="ml-2 h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5" />
        </a>
      </Button>
    </div>
  </div>
);

export { BentoCard, BentoGrid };