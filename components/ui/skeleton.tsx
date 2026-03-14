import { cn } from "@/lib/utils";

function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "animate-pulse rounded-md dark:bg-gray-800 bg-gray-100",
        className,
      )}
      {...props}
    />
  );
}

export { Skeleton };
