import BloomyLogo from "../ui/BloomyLogo";

export default function Splash() {
  return (
    <div className="flex flex-col items-center justify-center py-32 bloom-fade">
      <div className="w-20 h-20 rounded-3xl bb-grad-1 flex items-center justify-center shadow-xl bb-shadow-F48FB1-30 bloom-float">
        <BloomyLogo className="w-14 h-14" />
      </div>
    </div>
  );
}
