type ExpenseItem = { categoryId: string; expenseDate: string; description: string; amount: string | number };
// GET item order is not an API guarantee. Match saved line identities before attaching private receipts.
export function matchExpenseItems<T extends ExpenseItem & {id:string}>(input: ExpenseItem[], saved:T[]): T[] {
 const remaining=[...saved];
 return input.map(item=>{
  const index=remaining.findIndex(row=>row.categoryId===item.categoryId && row.expenseDate===item.expenseDate && row.description===item.description.trim() && Number(row.amount)===Number(item.amount));
  if(index<0) throw new Error('Draft created, but saved items could not be matched safely. Open the draft to attach receipts.');
  return remaining.splice(index,1)[0];
 });
}
