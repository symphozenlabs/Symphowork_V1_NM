// UX checks mirror source upload-admission metadata rules. Server scanning remains authoritative.
export function validateDocumentFile(file: Pick<File, 'name' | 'size' | 'type'>): void {
 if (file.size <= 0 || file.size > 10 * 1024 * 1024) throw new Error('Choose a non-empty file up to 10 MB.');
 const extensions: Record<string, string[]> = {'application/pdf':['.pdf'], 'image/jpeg':['.jpg','.jpeg'], 'image/png':['.png']};
 const extension = file.name.slice(file.name.lastIndexOf('.')).toLowerCase();
 if (!extensions[file.type]?.includes(extension)) throw new Error('Choose a PDF, JPEG or PNG file with a matching extension.');
}
