// This fixture is only used by a standalone Vite server. It is never a SvelteKit route.
const denied=new URLSearchParams(location.search).has('denied');
export const page={data:{context:{user:{id:'fixture-user',platformRole:'NONE'},organization:{id:'fixture-org'},membership:{organizationId:'fixture-org',status:'active'},role:{key:'FIXTURE'},permissions:denied?[]:['expense.submit','expense.cancel','task.manage.dependencies','project.edit','project.archive']}},url:new URL(location.href)};
export const navigating={to:null};
