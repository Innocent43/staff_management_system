import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto max-w-md space-y-4 px-4 py-24 text-center">
      <p className="text-5xl font-semibold text-navy-300">404</p>
      <h1 className="text-xl font-semibold text-navy-900">Page not found</h1>
      <p className="text-sm text-navy-600">
        The page you are looking for does not exist or was moved.
      </p>
      <Link
        href="/dashboard"
        className="inline-block rounded-lg bg-navy-900 px-4 py-2 text-sm font-medium text-white hover:bg-navy-800"
      >
        Go to home
      </Link>
    </div>
  );
}