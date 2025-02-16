import "animate.css"

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center gap-4 animate__animated animate__flash">
      <div className="text-2xl font-bold">Error 404</div>
      <div className="text-xl">Not found</div>
    </div>
  );
}
