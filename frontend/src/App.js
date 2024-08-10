import { useState } from "react";
import CalendarImg from "./assets/Calendar.png";
import ChartImg from "./assets/Chart.png";
import ChartFillImg from "./assets/Chart_fill.png";
import ChatImg from "./assets/Chat.png";
import FolderImg from "./assets/Folder.png";
import SearchImg from "./assets/Search.png";
import SettingImg from "./assets/Setting.png";
import UserImg from "./assets/User.png";
import ControlImg from "./assets/control.png";
import LogoImg from "./assets/logo.png";
import Configure from "./Configure";

const App = () => {
  const [open, setOpen] = useState(true);
  const Menus = [
    { title: "Dashboard", logo: ChartFillImg },
    { title: "Inbox", logo: ChatImg },
    { title: "Accounts", logo: UserImg, gap: true },
    { title: "Schedule ", logo: CalendarImg },
    { title: "Search", logo: SearchImg },
    { title: "Analytics", logo: ChartImg },
    { title: "Files ", logo: FolderImg, gap: true },
    { title: "Setting", logo: SettingImg },
  ];

  return (
    <div className="flex">
      <div
        className={` ${
          open ? "w-72" : "w-20 "
        } bg-dark-purple h-screen p-5  pt-8 relative duration-300`}
      >
        <img
          src={CalendarImg}
          className={`absolute cursor-pointer -right-3 top-9 w-7 border-dark-purple
           border-2 rounded-full  ${!open && "rotate-180"}`}
          onClick={() => setOpen(!open)}
        />
        <div className="flex gap-x-4 items-center">
          <img
            src={LogoImg}
            className={`cursor-pointer duration-500 ${
              open && "rotate-[360deg]"
            }`}
          />
          <h1
            className={`text-white origin-left font-medium text-xl duration-200 ${
              !open && "scale-0"
            }`}
          >
            Designer
          </h1>
        </div>
        <ul className="pt-6">
          {Menus.map((Menu, index) => (
            <li
              key={index}
              className={`flex  rounded-md p-2 cursor-pointer hover:bg-light-white text-gray-300 text-sm items-center gap-x-4 
              ${Menu.gap ? "mt-9" : "mt-2"} ${
                index === 0 && "bg-light-white"
              } `}
            >
              <img src={Menu.logo} />
              <span className={`${!open && "hidden"} origin-left duration-200`}>
                {Menu.title}
              </span>
            </li>
          ))}
        </ul>
      </div>
      <div className="bg-gray-200 w-full">
        <Configure />
      </div>
    </div>
  );
};
export default App;
