export default function Loading() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center p-xl min-h-[60vh] bg-surface-container-low">
      <div className="w-12 h-12 border-4 border-outline-variant border-t-primary rounded-full animate-spin"></div>
      <p className="mt-4 font-label-lg text-primary animate-pulse font-['Aclonica']">Loading...</p>
    </div>
  )
}
