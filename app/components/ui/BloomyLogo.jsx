export default function BloomyLogo({ className = "", alt = "Bloomy лого" }) {
  return <img src="/bloomy-logo.svg" alt={alt} className={`object-contain ${className}`} />;
}
