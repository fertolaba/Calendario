import React, { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Columns3, Grid, Plus, X, CalendarRange, Repeat } from "lucide-react";
import { collection, query, onSnapshot, writeBatch, doc } from "firebase/firestore";
import { db } from "./firebase";

// --- IMÁGENES DE LOS USUARIOS ---
// (Asegúrate de tener estas imágenes en tu carpeta public o assets según como lo configuraste antes)
// Como acordamos usar la carpeta public, las referencias son strings directos abajo.

// --- Interfaces ---
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
}

// Lista de feriados
const feriados = [
  "2025-01-01", "2025-11-24", "2025-11-21", "2025-12-08", "2025-12-25","2026-01-01","2026-02-16","2026-02-17","2026-03-24",
  "2026-04-02","2026-04-03","2026-05-01","2026-05-25", "2026-06-20","2026-07-09","2026-12-25","2026-12-08"
];

// --- LISTAS DE DATOS ---
const users = [
  "Brian", "Leonardo", "Lucas", "Luca", "Victor", 
  "Nicolas", "Fernando", "Nemesio", "Santiago", "Jose"
];

// --- MAPA DE IMÁGENES (Usando carpeta public) ---
const userImages: Record<string, string> = {
  "Brian": "/brian.jpg",
  "Leonardo": "/leo.jpeg",
  "Lucas": "/lucas.jpeg",
  "Luca": "/zane.jpg",
  "Victor": "/victor.jpg",
  "Nicolas": "/nico.jpeg",
  "Fernando": "/fernando.jpg",
  "Nemesio": "/nemesio.jpeg",
};

const reasons = [
  "Oficina",
  "Día de examen",
  "Vacaciones",
  "Wellness",
  "Otro"
];

// --- Helper de Colores ---
const getReasonColor = (reason: string) => {
  switch (reason) {
    case "Vacaciones": return "border-green-500";
    case "Día de examen": return "border-yellow-500";
    case "Wellness": return "border-blue-500";
    case "Otro": return "border-purple-500";
    default: return "border-zinc-500";
  }
};

// --- Helper para generar los días ---
const generateDays = (month: number, year: number, currentMeetings: Record<string, Meeting[]>): DayType[] => {
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
      classNames: isFeriado
        ? "bg-red-600 cursor-not-allowed"
        : "bg-[#1e1e1e] cursor-pointer",
      meetingInfo: currentMeetings[fullDate] || [],
    });
  }

  const totalCells = Math.ceil(days.length / 7) * 7;
  for (let i = days.length; i < totalCells; i++) {
    days.push({ day: `+${i - days.length + 1}`, classNames: "bg-zinc-700/20" });
  }

  return days;
};

// --- Componente de Día ---
const Day: React.FC<DayProps> = ({ classNames, day }) => {
  return (
    <motion.div
      className={`relative flex flex-col items-center justify-between p-1 md:p-2 ${classNames} h-20 md:h-24 rounded-xl md:rounded-[20px]`}
    >
      <span className="text-sm md:text-lg font-semibold text-white">
        {!(day.day[0] === "+" || day.day[0] === "-") && day.day}
      </span>

      {day.meetingInfo && day.meetingInfo.length > 0 && (
        <div className="flex flex-wrap justify-center gap-0.5 md:gap-1 mt-1">
          {day.meetingInfo.map((m, i) => {
            const borderColor = getReasonColor(m.title);
            
            return (
              <motion.div
                key={i}
                className={`rounded-full bg-zinc-700 text-white flex items-center justify-center overflow-hidden border md:border-2 ${borderColor} w-5 h-5 md:w-6 md:h-6`}
                title={`${m.participants[0]} - ${m.title}`}
              >
                {m.avatarUrl ? (
                  <img src={m.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-[8px] md:text-xs font-bold">
                    {m.participants[0] ? m.participants[0].charAt(0).toUpperCase() : "?"}
                  </span>
                )}
              </motion.div>
            );
          })}
        </div>
      )}
    </motion.div>
  );
};

// --- Grilla ---
const CalendarGrid: React.FC<{ days: DayType[]; }> = ({ days }) => (
  <div className="grid grid-cols-7 gap-1 md:gap-3">
    {days.map((day, index) => (
      <Day key={`${day.day}-${index}`} classNames={day.classNames} day={day} />
    ))}
  </div>
);

// --- Componente Principal ---
const App: React.FC = () => {
  const [moreView, setMoreView] = useState(false);
  const [showModal, setShowModal] = useState(false);

  const [activeTab, setActiveTab] = useState<"range" | "recurring">("range");
  const [formData, setFormData] = useState({
    name: "",
    startDate: "",
    endDate: "", 
    dayOfWeek: "1",
    reason: "Oficina"
  });

  const today = new Date();
  const [currentMonth, setCurrentMonth] = useState(today.getMonth());
  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [meetings, setMeetings] = useState<Record<string, Meeting[]>>({});

  useEffect(() => {
    const q = query(collection(db, "meetings"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const meetingsFromDb: Record<string, Meeting[]> = {};
      snapshot.docs.forEach((doc) => {
        const data = doc.data() as Meeting;
        const dateObj = new Date(data.date.includes('T') ? data.date : `${data.date}T12:00:00`); 
        
        if (!isNaN(dateObj.getTime())) {
            const year = dateObj.getFullYear();
            const month = String(dateObj.getMonth() + 1).padStart(2, '0');
            const day = String(dateObj.getDate()).padStart(2, '0');
            const dateKey = `${year}-${month}-${day}`;
            
            if (!meetingsFromDb[dateKey]) meetingsFromDb[dateKey] = [];
            meetingsFromDb[dateKey].push(data);
        }
      });
      setMeetings(meetingsFromDb);
    });
    return () => unsubscribe();
  }, []);

  const days = useMemo(() => generateDays(currentMonth, currentYear, meetings), [currentMonth, currentYear, meetings]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name) return;

    const meetingTitle = activeTab === "recurring" ? "Oficina" : formData.reason;
    const userImageUrl = userImages[formData.name];

    // --- LÓGICA DE HORARIOS ---
    let meetingTime = "";

    if (meetingTitle === "Oficina") {
        if (formData.name === "Fernando") {
            meetingTime = "09:00 AM - 13:00 PM";
        } else if (formData.name === "Luca") {
            meetingTime = "14:00 PM - 18:00 PM";
        } else {
            meetingTime = "09:00 AM - 18:00 PM";
        }
    } else {
        // Para vacaciones, examen, wellness u otros, no ponemos horario
        meetingTime = ""; 
    }

    const baseMeetingData = {
        title: meetingTitle,
        time: meetingTime, // Usamos la variable calculada
        location: "Oficina",
        participants: [formData.name],
        userInitial: formData.name.charAt(0).toUpperCase(),
        avatarUrl: userImageUrl
    };

    try {
        const batch = writeBatch(db);
        let count = 0;

        const getDocumentId = (date: string, name: string) => {
            return `${date}_${name}`; 
        };

        if (activeTab === "recurring") {
            if (!formData.dayOfWeek) return;
            const targetDay = parseInt(formData.dayOfWeek);
            
            let currentDate = new Date(); 
            while (currentDate.getDay() !== targetDay) {
                currentDate.setDate(currentDate.getDate() + 1);
            }

            const targetYear = currentYear; 
            if(currentDate.getFullYear() < targetYear) {
                 currentDate = new Date(targetYear, 0, 1);
                 while (currentDate.getDay() !== targetDay) currentDate.setDate(currentDate.getDate() + 1);
            }

            while (currentDate.getFullYear() === targetYear) {
                const y = currentDate.getFullYear();
                const m = String(currentDate.getMonth() + 1).padStart(2, '0');
                const d = String(currentDate.getDate()).padStart(2, '0');
                const dateStr = `${y}-${m}-${d}`;

                if (!feriados.includes(dateStr)) {
                    const docId = getDocumentId(dateStr, formData.name);
                    const newRef = doc(db, "meetings", docId);
                    
                    batch.set(newRef, { ...baseMeetingData, date: dateStr });
                    count++;
                }
                currentDate.setDate(currentDate.getDate() + 7);
            }

        } else {
            if (!formData.startDate || !formData.endDate) return;

            let currentDate = new Date(formData.startDate + "T12:00:00");
            const finalDate = new Date(formData.endDate + "T12:00:00");

            if (currentDate > finalDate) {
                alert("La fecha 'Desde' debe ser anterior a 'Hasta'.");
                return;
            }

            while (currentDate <= finalDate) {
                const y = currentDate.getFullYear();
                const m = String(currentDate.getMonth() + 1).padStart(2, '0');
                const d = String(currentDate.getDate()).padStart(2, '0');
                const dateStr = `${y}-${m}-${d}`;

                if (!feriados.includes(dateStr)) {
                    const docId = getDocumentId(dateStr, formData.name);
                    const newRef = doc(db, "meetings", docId);

                    batch.set(newRef, { ...baseMeetingData, date: dateStr });
                    count++;
                }
                currentDate.setDate(currentDate.getDate() + 1);
            }
        }

        if (count > 0) {
            await batch.commit();
            setFormData({ name: "", startDate: "", endDate: "", dayOfWeek: "1", reason: "Oficina" });
            setShowModal(false);
        } else {
            alert("No se agendaron días (quizás eran todos feriados).");
        }

    } catch (error) {
      console.error("Error al guardar:", error);
      alert("Hubo un error al guardar.");
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 11) { setCurrentMonth(0); setCurrentYear(prev => prev + 1); } 
    else setCurrentMonth(prev => prev + 1);
  };
  const handlePrevMonth = () => {
    if (currentMonth === 0) { setCurrentMonth(11); setCurrentYear(prev => prev - 1); } 
    else setCurrentMonth(prev => prev - 1);
  };

  const monthNames = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
  const daysOfWeek = ["DOM", "LUN", "MAR", "MIER", "JUEV", "VIER", "SAB"];

  return (
    <main className="w-full min-h-screen flex flex-col items-center justify-start md:justify-center px-2 py-4 md:px-4 md:py-10 bg-black text-white relative">
      
      {/* --- MODAL --- */}
      <AnimatePresence>
        {showModal && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowModal(false)}
          >
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
              className="bg-[#1e1e1e] border border-zinc-700 p-6 rounded-2xl w-[95%] md:w-full max-w-md shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl md:text-2xl font-bold text-white">Agendar</h3>
                <button onClick={() => setShowModal(false)}><X className="text-zinc-400 hover:text-white" /></button>
              </div>

              <div className="flex bg-black/40 p-1 rounded-lg mb-6">
                <button 
                    onClick={() => setActiveTab("range")}
                    className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-md text-sm font-medium transition-colors ${activeTab === "range" ? "bg-zinc-700 text-white" : "text-zinc-400 hover:text-white"}`}
                >
                    <CalendarRange size={16} /> Por Rango
                </button>
                <button 
                    onClick={() => setActiveTab("recurring")}
                    className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-md text-sm font-medium transition-colors ${activeTab === "recurring" ? "bg-zinc-700 text-white" : "text-zinc-400 hover:text-white"}`}
                >
                    <Repeat size={16} /> Semanal
                </button>
              </div>
              
              <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                <div className="flex flex-col gap-1">
                  <label className="text-sm font-medium text-zinc-400">¿Quién?</label>
                  <select 
                    className="bg-black/30 border border-zinc-700 rounded-lg p-3 text-white focus:outline-none focus:border-blue-500"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    required
                  >
                    <option value="" disabled className="text-zinc-500">Seleccionar...</option>
                    {users.map((user) => (
                        <option key={user} value={user} className="bg-[#1e1e1e]">{user}</option>
                    ))}
                  </select>
                </div>
                
                {activeTab === "range" ? (
                    <>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="flex flex-col gap-1">
                                <label className="text-sm font-medium text-zinc-400">Desde</label>
                                <input 
                                    type="date" 
                                    className="bg-black/30 border border-zinc-700 rounded-lg p-3 text-white focus:outline-none focus:border-blue-500 [color-scheme:dark]"
                                    value={formData.startDate}
                                    onChange={(e) => setFormData({...formData, startDate: e.target.value})}
                                    required={activeTab === "range"}
                                />
                            </div>
                            <div className="flex flex-col gap-1">
                                <label className="text-sm font-medium text-zinc-400">Hasta</label>
                                <input 
                                    type="date" 
                                    className="bg-black/30 border border-zinc-700 rounded-lg p-3 text-white focus:outline-none focus:border-blue-500 [color-scheme:dark]"
                                    value={formData.endDate}
                                    onChange={(e) => setFormData({...formData, endDate: e.target.value})}
                                    required={activeTab === "range"}
                                />
                            </div>
                        </div>

                        <div className="flex flex-col gap-1">
                            <label className="text-sm font-medium text-zinc-400">Motivo</label>
                            <select 
                                className="bg-black/30 border border-zinc-700 rounded-lg p-3 text-white focus:outline-none focus:border-blue-500"
                                value={formData.reason}
                                onChange={(e) => setFormData({...formData, reason: e.target.value})}
                            >
                                {reasons.map(r => (
                                    <option key={r} value={r} className="bg-[#1e1e1e]">{r}</option>
                                ))}
                            </select>
                        </div>
                    </>
                ) : (
                    <div className="flex flex-col gap-1">
                        <label className="text-sm font-medium text-zinc-400">Día semanal (Todo el año)</label>
                        <select 
                            className="bg-black/30 border border-zinc-700 rounded-lg p-3 text-white focus:outline-none focus:border-blue-500"
                            value={formData.dayOfWeek}
                            onChange={(e) => setFormData({...formData, dayOfWeek: e.target.value})}
                        >
                            <option value="1">Lunes</option>
                            <option value="2">Martes</option>
                            <option value="3">Miércoles</option>
                            <option value="4">Jueves</option>
                            <option value="5">Viernes</option>
                        </select>
                        <p className="text-xs text-zinc-500 mt-1">Se agendará como "Oficina" automáticamente.</p>
                    </div>
                )}

                <button 
                  type="submit" 
                  className="mt-4 bg-white text-black font-bold py-3 rounded-lg hover:bg-zinc-200 transition-colors"
                >
                  Confirmar
                </button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence mode="wait">
        <motion.div
          key="calendar-container"
          layout
          className="relative mx-auto my-4 md:my-10 w-full flex-col lg:flex-row justify-center flex items-center gap-8"
        >
          <motion.div layout className="w-full max-w-3xl">
            <motion.div key="calendar-view" className="w-full flex-col flex gap-4">
              
              {/* Header */}
              <div className="w-full flex flex-col md:flex-row items-center justify-between gap-4 md:gap-0">
                <motion.h2 className="text-3xl md:text-5xl font-bold tracking-wider text-zinc-300">
                  {monthNames[currentMonth]} <span className="opacity-50">{currentYear}</span>
                </motion.h2>
                
                <div className="flex gap-2 items-center flex-wrap justify-center">
                  <motion.button className="px-3 py-1.5 md:px-4 md:py-2 bg-white text-sm md:text-base text-black rounded-lg font-semibold" onClick={handlePrevMonth}>
                    Anterior
                  </motion.button>
                  <motion.button className="px-3 py-1.5 md:px-4 md:py-2 bg-white text-sm md:text-base text-black rounded-lg font-semibold" onClick={handleNextMonth}>
                    Siguiente
                  </motion.button>

                  <motion.button
                    className="flex items-center relative border rounded-lg p-1 border-[#323232] bg-[#1e1e1e]"
                    onClick={() => setMoreView(!moreView)}
                    style={{ height: '42px' }} 
                  >
                    <div className={`relative z-[2] flex items-center justify-center w-10 h-full transition-colors duration-300 ${!moreView ? "text-[#1e1e1e]" : "text-zinc-400"}`}><Columns3 size={20} /></div>
                    <div className={`relative z-[2] flex items-center justify-center w-10 h-full transition-colors duration-300 ${moreView ? "text-[#1e1e1e]" : "text-zinc-400"}`}><Grid size={20} /></div>
                    <div
                      className="absolute top-1 bottom-1 bg-white rounded-md duration-300 transition-all"
                      style={{ width: "40px", left: moreView ? "calc(100% - 44px)" : "4px" }}
                    ></div>
                  </motion.button>

                  {/* Botón de Agregar */}
                  <motion.button
                    className="flex items-center justify-center border rounded-lg p-1 border-[#323232] bg-[#1e1e1e] text-zinc-400 hover:text-white hover:border-zinc-500 transition-colors"
                    style={{ height: '42px', width: '42px' }}
                    onClick={() => setShowModal(true)}
                  >
                    <Plus size={24} />
                  </motion.button>

                </div>
              </div>

              {/* Días semana */}
              <div className="grid grid-cols-7 gap-1 md:gap-3">
                {daysOfWeek.map((day) => (
                  <div key={day} className="text-xs md:text-base text-white text-center bg-[#323232] py-2 rounded-lg md:rounded-xl">
                    {day}
                  </div>
                ))}
              </div>

              <CalendarGrid days={days} />

              {/* --- REFERENCIAS --- */}
              <div className="flex flex-wrap justify-center gap-x-6 gap-y-2 mt-4 pt-4 border-t border-[#323232]">
                <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-green-500"></span>
                    <span className="text-xs md:text-sm text-zinc-400">Vacaciones</span>
                </div>
                <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-yellow-500"></span>
                    <span className="text-xs md:text-sm text-zinc-400">Día de examen</span>
                </div>
                <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-blue-500"></span>
                    <span className="text-xs md:text-sm text-zinc-400">Wellness</span>
                </div>
                <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-zinc-500"></span>
                    <span className="text-xs md:text-sm text-zinc-400">Oficina</span>
                </div>
                <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-purple-500"></span>
                    <span className="text-xs md:text-sm text-zinc-400">Otro</span>
                </div>
              </div>

            </motion.div>
          </motion.div>

          {moreView && (
            <motion.div
              key="more-view" layout initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }} transition={{ duration: 0.3 }}
              className="w-full max-w-3xl mt-4 flex flex-col gap-4"
            >
              <div className="w-full flex flex-col items-start justify-between">
                <h2 className="text-3xl md:text-4xl mb-2 font-bold tracking-wider text-zinc-300">Bookings</h2>
                <p className="font-medium text-zinc-300/50">Próximas visitas agendadas.</p>
              </div>
              <div className="border-2 border-[#323232] rounded-xl overflow-hidden shadow-md h-[50vh] md:h-[80vh] overflow-y-scroll flex flex-col bg-[#1e1e1e]/50">
                <AnimatePresence>
                  {days.filter((day) => day.meetingInfo && day.meetingInfo.length > 0)
                    .map((day) => (
                      <div key={day.day} className="border-b border-[#323232] last:border-0">
                        {day.meetingInfo!.map((m, idx) => {
                            let reasonColorClass = "text-blue-400";
                            if (m.title === "Vacaciones") reasonColorClass = "text-green-400";
                            if (m.title === "Día de examen") reasonColorClass = "text-yellow-400";
                            if (m.title === "Wellness") reasonColorClass = "text-blue-400";
                            if (m.title === "Otro") reasonColorClass = "text-purple-400";
                            if (m.title === "Oficina") reasonColorClass = "text-zinc-400";

                            return (
                              <div key={idx} className="p-4 flex flex-col gap-2">
                                <div className="flex justify-between text-zinc-400 text-sm">
                                  <span>{m.date}</span>
                                  {/* Mostrar hora SOLO si tiene contenido */}
                                  {m.time && <span>{m.time}</span>}
                                </div>
                                <div className="font-bold text-lg text-white">{m.participants.join(", ")}</div>
                                <div className={`text-sm ${reasonColorClass}`}>{m.title}</div>
                              </div>
                            );
                        })}
                      </div>
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