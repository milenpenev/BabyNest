import{dose,schedule,series}from"./helpers";
export const roSchedule=schedule("RO","RO-MOH-2025.1","RO-MOH-2025",[dose("HEPB",1,{days:0}),dose("BCG",1,{days:2}),...series("HEXA",[{months:2},{months:4},{months:11}]),...series("PCV",[{months:2},{months:4},{months:11}]),...series("MMR",[{months:12},{years:5}]),dose("DTaPIPV",4,{years:6}),dose("TD",5,{years:14})]);
