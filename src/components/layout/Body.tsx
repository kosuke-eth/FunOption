import cn from "../../utils/cn";

export default function Body({
  className,
  ...props
}: React.HtmlHTMLAttributes<HTMLDivElement>) {
  return (
    <>
      <div
        className={cn("max-w-7xl mx-auto px-6 relative", className)}
        {...props}
      >
        {props.children}
      </div>
    </>
  );
}
