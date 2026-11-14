// import { useEmployees } from "@/hooks/use-employees";
import { useEmployees } from "@/hooks/use-employees";

// The APIs give ids only. This hook turns ids into names and also
// supplies the people for every employee dropdown.
export function useEmployeeOptions() {
  const { data } = useEmployees({ limit: 100 });
  const people = data ?? [];

  // attendance, payroll and tasks use the EMPLOYEE (membership) id
  function nameOf(employeeId: number): string {
    const person = people.find((item) => item.id === employeeId);
    return person ? person.user.full_name : `Employee #${employeeId}`;
  }

  // the audit log uses the USER id, which is a different number
  function nameOfUser(userId: number | null): string {
    if (userId === null) return "System";
    const person = people.find((item) => item.user.id === userId);
    return person ? person.user.full_name : `User #${userId}`;
  }

  return { people, nameOf, nameOfUser };
}




// // The attendance API gives employee_id only. This hook turns ids into names
// // and also supplies the people for every employee dropdown.
// export function useEmployeeOptions() {
//   const { data } = useEmployees({ limit: 100 });
//   const people = data ?? [];

//   function nameOf(employeeId: number): string {
//     const person = people.find((item) => item.id === employeeId);
//     return person ? person.user.full_name : `Employee #${employeeId}`;
//   }

//   return { people, nameOf };
// }