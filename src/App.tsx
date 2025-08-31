import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Columns3, Grid } from "lucide-react";
import fernandoImg from "./assets/fernando.jpg";
import lucasimg from "./assets/lucas.jpeg";
import zaneimg from "./assets/zane.jpg";
import tamaraimg from "./assets/tamara.jpeg";
import nicoimg from "./assets/nico.jpeg";
import leoimg from "./assets/leo.jpeg";
import nemeimg from "./assets/nemesio.jpeg";

interface Meeting {
  date: string;
  time: string;
  title: string;
  participants: string[];
  location: string;
  userInitial?: string;
  avatarUrl?: string;
}

type DayType = {
  day: string;
  classNames: string;
  meetingInfo?: Meeting[];
};

interface DayProps {
  classNames: string;
  day: DayType;
  onHover: (day: string | null) => void;
}

// Feriados de ejemplo en Argentina
const feriados = [
  "2025-01-01",
  "2025-11-24",
  "2025-11-21",
  "2025-12-08",
  "2025-12-25",
];

// Generar automáticamente reuniones
const generateMeetings = (year: number): Record<string, Meeting[]> => {
  const meetings: Record<string, Meeting[]> = {};

  for (let month = 0; month < 12; month++) {
    const lastDate = new Date(year, month + 1, 0).getDate();
    for (let day = 1; day <= lastDate; day++) {
      const dateObj = new Date(year, month, day);
      const weekday = dateObj.getDay(); // 0=Dom, 1=Lun, ..., 6=Sab
      const dayStr = day < 10 ? `0${day}` : `${day}`;
      const fullDate = `${year}-${(month + 1).toString().padStart(2, "0")}-${dayStr}`;

      meetings[fullDate] = [];

      // Saltar feriados
      if (feriados.includes(fullDate)) continue;

      if (weekday >= 1 && weekday <= 5) {
        meetings[fullDate].push({
          date: dateObj.toDateString(),
          time: "09:00 AM",
          title: "Oficina",
          participants: ["Zane"],
          location: "Oficina",
          avatarUrl: zaneimg,
        });
      }      

      // Fernando lunes a jueves
      if (weekday >= 1 && weekday <= 4) {
        meetings[fullDate].push({
          date: dateObj.toDateString(),
          time: "09:00 AM",
          title: "Oficina",
          participants: ["Fernando"],
          location: "Oficina",
          avatarUrl: fernandoImg,
        });
      }
      // leo  jueves
      if (weekday == 4) {
        meetings[fullDate].push({
          date: dateObj.toDateString(),
          time: "09:00 AM",
          title: "Oficina",
          participants: ["Fernando"],
          location: "Oficina",
          avatarUrl: leoimg,
        });
      }

            // Fernando lunes a jueves
      if (weekday ==3) {
        meetings[fullDate].push({
          date: dateObj.toDateString(),
          time: "09:00 AM",
          title: "Oficina",
          participants: ["Fernando"],
          location: "Oficina",
          avatarUrl: nemeimg,
        });
      }
      // Lucas martes 
      if (weekday ==2) {
        meetings[fullDate].push({
          date: dateObj.toDateString(),
          time: "09:00 AM",
          title: "Oficina",
          participants: ["Tamara"],
          location: "Oficina",
          avatarUrl: lucasimg,
        });
      }
      if (weekday ==2) {
        meetings[fullDate].push({
          date: dateObj.toDateString(),
          time: "09:00 AM",
          title: "Oficina",
          participants: ["Nicolas"],
          location: "Oficina",
          avatarUrl: nicoimg,
        });
      }
      // Tamara martes a viernes
      if (weekday >= 2 && weekday <= 5) {
        meetings[fullDate].push({
          date: dateObj.toDateString(),
          time: "09:00 AM",
          title: "Oficina",
          participants: ["Tamara"],
          location: "Oficina",
          avatarUrl: tamaraimg,
        });
      }
    }
  }

  return meetings;
};

const meetings = generateMeetings(2025);

const generateDays = (month: number, year: number): DayType[] => {
  const days: DayType[] = [];
  const firstDay = new Date(year, month, 1).getDay();
  const lastDate = new Date(year, month + 1, 0).getDate();

  for (let i = 0; i < firstDay; i++) {
    days.push({ day: `-${firstDay - i}`, classNames: "bg-zinc-700/20" });
  }

  for (let d = 1; d <= lastDate; d++) {
    const dayStr = d < 10 ? `0${d}` : `${d}`;
    const fullDate = `${year}-${(month + 1).toString().padStart(2, "0")}-${dayStr}`;
    const isFeriado = feriados.includes(fullDate);
    days.push({
      day: dayStr,
      classNames: isFeriado ? "bg-red-600 cursor-not-allowed" : "bg-[#1e1e1e] cursor-pointer",
      meetingInfo: meetings[fullDate],
    });
  }

  const totalCells = Math.ceil(days.length / 7) * 7;
  for (let i = days.length; i < totalCells; i++) {
    days.push({ day: `+${i - days.length + 1}`, classNames: "bg-zinc-700/20" });
  }

  return days;
};

const Day: React.FC<DayProps> = ({ classNames, day, onHover }) => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <motion.div
      className={`relative flex flex-col items-center justify-between p-2 ${classNames}`}
      style={{ height: "6rem", borderRadius: 20 }}
      onMouseEnter={() => {
        setIsHovered(true);
        onHover(day.day);
      }}
      onMouseLeave={() => {
        setIsHovered(false);
        onHover(null);
      }}
      id={`day-${day.day}`}
    >
      {/* Número del día */}
      <span className="text-lg font-semibold text-white">
        {!(day.day[0] === "+" || day.day[0] === "-") && day.day}
      </span>

      {/* Avatares dentro del cuadrado */}
      {day.meetingInfo && day.meetingInfo.length > 0 && (
<div className="flex flex-wrap justify-center gap-1 mt-1">
  {day.meetingInfo.map((m, i) => (
    <motion.div
      key={i}
      className="rounded-full bg-zinc-700 text-white flex items-center justify-center overflow-hidden"
      style={{
        width: "1.5rem",  // más chico
        height: "1.5rem",
      }}
    >
      {m.avatarUrl ? (
        <img
          src={m.avatarUrl}
          alt={m.participants[0]}
          className="w-full h-full object-cover rounded-full"
        />
      ) : (
        <span className="text-xs font-bold">{m.userInitial}</span>
      )}
    </motion.div>
  ))}
</div>

      )}
    </motion.div>
  );
};


const CalendarGrid: React.FC<{ onHover: (day: string | null) => void; days: DayType[] }> = ({
  onHover,
  days,
}) => (
  <div className="grid grid-cols-7 gap-3">
    {days.map((day, index) => (
      <Day key={`${day.day}-${index}`} classNames={day.classNames} day={day} onHover={onHover} />
    ))}
  </div>
);

const App: React.FC = () => {
  const [hoveredDay, setHoveredDay] = useState<string | null>(null);
  const [moreView, setMoreView] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(8); // Septiembre
  const [currentYear, setCurrentYear] = useState(2025);
  const [days, setDays] = useState<DayType[]>(generateDays(currentMonth, currentYear));

  useEffect(() => {
    setDays(generateDays(currentMonth, currentYear));
  }, [currentMonth, currentYear]);

  const handleDayHover = (day: string | null) => setHoveredDay(day);

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(prev => prev + 1);
    } else setCurrentMonth(prev => prev + 1);
  };

  const handlePrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(prev => prev - 1);
    } else setCurrentMonth(prev => prev - 1);
  };

  const monthNames = [
    "Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"
  ];

  const daysOfWeek = ["DOM","LUN","MAR","MIER","JUEV","VIER","SAB"];

  const sortedDays = React.useMemo(() => {
    if (!hoveredDay) return days;
    return [...days].sort((a, b) => {
      if (a.day === hoveredDay) return -1;
      if (b.day === hoveredDay) return 1;
      return 0;
    });
  }, [hoveredDay, days]);

  return (
    <main className="w-full min-h-screen flex flex-col items-center justify-start md:justify-center px-4 py-10 bg-black">
      <AnimatePresence mode="wait">
        <motion.div
          key="calendar-container"
          layout
          className="relative mx-auto my-10 w-full flex-col lg:flex-row justify-center flex items-center gap-8"
        >
          {/* Calendario */}
          <motion.div layout className="w-full max-w-3xl">
            <motion.div key="calendar-view" className="w-full flex-col flex gap-4">
              {/* Header con botones */}
              <div className="w-full flex items-center justify-between">
                <motion.h2 className="text-5xl mb-2 font-bold tracking-wider text-zinc-300">
                  {monthNames[currentMonth]} <span className="opacity-50">{currentYear}</span>
                </motion.h2>
                <div className="flex gap-2 items-center">
                  <motion.button
                    className="px-4 py-2 bg-white text-black rounded-lg font-semibold"
                    onClick={handlePrevMonth}
                  >
                    Anterior
                  </motion.button>
                  <motion.button
                    className="px-4 py-2 bg-white text-black rounded-lg font-semibold"
                    onClick={handleNextMonth}
                  >
                    Siguiente
                  </motion.button>
                  <motion.button
                    className="flex items-center text-[#323232] relative border rounded-lg py-2 px-2 border-[#323232] gap-3"
                    onClick={() => setMoreView(!moreView)}
                  >
                    <Columns3 className=" z-[2]" />
                    <Grid className=" z-[2]" />
                    <div
                      className="absolute top-0 left-0 w-10 h-[85%] bg-white rounded-md duration-300 transition-transform"
                      style={{
                        top: "50%",
                        transform: moreView
                          ? "translateY(-50%) translateX(50px)"
                          : "translateY(-50%) translateX(4px)",
                      }}
                    ></div>
                  </motion.button>
                </div>
              </div>

              {/* Días de la semana */}
              <div className="grid grid-cols-7 gap-3">
                {daysOfWeek.map((day) => (
                  <div
                    key={day}
                    className="text-base text-white text-center bg-[#323232] py-2 rounded-xl"
                  >
                    {day}
                  </div>
                ))}
              </div>

              <CalendarGrid onHover={handleDayHover} days={days} />
            </motion.div>
          </motion.div>

          {/* Panel de Bookings */}
          {moreView && (
            <motion.div
              key="more-view"
              layout
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              transition={{ duration: 0.3 }}
              className="w-full max-w-3xl mt-4 flex flex-col gap-4"
            >
              <div className="w-full flex flex-col items-start justify-between">
                <h2 className="text-4xl mb-2 font-bold tracking-wider text-zinc-300">
                  Bookings
                </h2>
                <p className="font-medium text-zinc-300/50">
                  See upcoming and past events booked through your event type links.
                </p>
              </div>

              <div className="border-2 border-[#323232] rounded-xl overflow-hidden shadow-md h-[80vh] overflow-y-scroll flex flex-col">
                <AnimatePresence>
                  {sortedDays
                    .filter((day) => day.meetingInfo)
                    .map((day) => (
                      <motion.div
                        key={day.day}
                        className={`py-1 border-b-2 border-[#323232] last:border-b-0 transition-colors duration-300 w-full`}
                        layout
                        style={{
                          background: hoveredDay === day.day ? "#1e1e1e" : "",
                        }}
                      >
                        {day.meetingInfo!.map((meeting, mIndex) => (
                          <motion.div
                            key={mIndex}
                            className="p-4 border-b last:border-b-0 border-[#323232]"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            transition={{ duration: 0.2, delay: mIndex * 0.05 }}
                          >
                            <div className="flex justify-between items-center mb-2">
                              <span className="text-base text-white">{meeting.date}</span>
                              <span className="text-base text-white">{meeting.time}</span>
                            </div>
                            <h3 className="font-semibold text-xl mb-1 text-white">{meeting.title}</h3>
                            <p className="text-base text-zinc-600 mb-1">
                              {meeting.participants.join(", ")}
                            </p>
                            <div className="flex items-center text-blue-500 text-base">
                              <svg
                                className="w-5 h-5 mr-1"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                                xmlns="http://www.w3.org/2000/svg"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
                                />
                              </svg>
                              <span>{meeting.location}</span>
                            </div>
                          </motion.div>
                        ))}
                      </motion.div>
                    ))}
                </AnimatePresence>
              </div>
            </motion.div>
          )}
        </motion.div>
      </AnimatePresence>
    </main>
  );
};

export default App;
