import cn from "../../utils/cn";

interface ContainerProps extends React.HTMLAttributes<HTMLDivElement> {}

export default function Container({ className, ...props }: ContainerProps) {
  return (
    <div
      className={cn("max-w-7xl mx-auto px-6", className)}
      {...props}
    />
  );
}
