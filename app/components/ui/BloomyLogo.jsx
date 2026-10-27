import { t } from "../../../lib/i18n";

export default function BloomyLogo({ className = "", alt = t("Bloomy лого", "Bloomy logo") }) {
  return <img src="/bloomy-logo.svg" alt={alt} className={`object-contain ${className}`} />;
}
