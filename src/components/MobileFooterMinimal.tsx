import { useLanguage } from "@/hooks/useLanguage";
import { tPage } from "@/lib/translations";

const MobileFooterMinimal = () => {
  const { lang } = useLanguage();
  const year = new Date().getFullYear();

  return (
    <div className="md:hidden py-4 text-center border-t border-border">
      <p className="text-[11px] text-muted-foreground">
        © {year} Staymakom.{" "}
        {tPage("mobileFooterMinimalAllRightsReserved")}
      </p>
    </div>
  );
};

export default MobileFooterMinimal;
