import { checkUser } from "@/lib/checkUser";

export default function NavBar() {
  
  const  user  = checkUser();
    return (
    <div>NavBar</div>
  )
}
