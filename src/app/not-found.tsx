import { Button } from "@/components/ui/button";
import Link from "next/link";
export default function NotFound() { return <div className="mx-auto max-w-xl py-24 text-center"><h1 className="text-2xl font-bold">Page not found</h1><p className="mt-2 text-muted">The requested workspace page does not exist yet.</p><Button className="mt-6" asChild><Link href="/">Return to overview</Link></Button></div>; }
