export function accountCanAccess(approved: boolean | null, consented: boolean) {
  return approved === true && consented;
}