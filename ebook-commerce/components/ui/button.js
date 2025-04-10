
export function Button({ children, className }) {
  return (
    <button className={`px-4 py-2 rounded-2xl font-medium ${className}`}>
      {children}
    </button>
  );
}
