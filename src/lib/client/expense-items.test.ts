import {describe,it,expect} from 'vitest';
import {matchExpenseItems} from './expense-items';
import {validateDocumentFile} from './document-file';
describe('expense receipt association',()=>{
 const a={categoryId:'travel',description:'Taxi',expenseDate:'2026-10-20',amount:'100'};
 const b={...a,description:'Train',amount:'200'};
 it('matches reordered server rows without attaching to another item',()=>expect(matchExpenseItems([a,b],[{...b,id:'b'},{...a,id:'a'}]).map(r=>r.id)).toEqual(['a','b']));
 it('matches source-trimmed descriptions',()=>expect(matchExpenseItems([{...a,description:'  Taxi  '}],[{...a,id:'a'}])[0].id).toBe('a'));
 it('consumes duplicate lines only once',()=>expect(matchExpenseItems([a,a],[{...a,id:'a'},{...a,id:'b'}]).map(r=>r.id)).toEqual(['a','b']));
 it('fails closed on missing or changed rows',()=>expect(()=>matchExpenseItems([a,b],[{...a,id:'a'}])).toThrow('matched safely'));
});
describe('document metadata UX validation',()=>{
 it.each([['photo.JPG','image/jpeg'],['scan.png','image/png'],['receipt.pdf','application/pdf']])('accepts source supported %s',(name,type)=>expect(()=>validateDocumentFile({name,type,size:10})).not.toThrow());
 it.each([0,10*1024*1024+1])('rejects invalid size %s',size=>expect(()=>validateDocumentFile({name:'a.pdf',type:'application/pdf',size})).toThrow('10 MB'));
 it('rejects spoofed extensions',()=>expect(()=>validateDocumentFile({name:'a.exe',type:'application/pdf',size:10})).toThrow('extension'));
});
