import { FormMessage } from "@/components/ui/form";

export default function ValidationMessages({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="pile">
      {children}
      <FormMessage match="valid">&nbsp;</FormMessage>
    </div>
  );
}
