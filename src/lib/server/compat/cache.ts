export function revalidatePath(_path: string, _type?: string): void {
  // SvelteKit does not use Next.js ISR path revalidation; safe no-op.
}

export function revalidateTag(_tag: string): void {
  // safe no-op.
}
