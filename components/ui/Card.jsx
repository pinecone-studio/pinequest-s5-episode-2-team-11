export default function Card({ children, className = "" }) {
  return (
    <div className={`bg-white rounded-3xl p-5 shadow-md border border-slate-100 bloom-fade ${className}`}>
      {children}
    </div>
  );
}
