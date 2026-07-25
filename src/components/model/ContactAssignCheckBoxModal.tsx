// import React, { useEffect, useRef, useState } from "react";
// import { InfoMessage } from "./CheckBoxModal";
// import "./ConfirmationModal.css";

// interface IContactAssignCheckBoxModalProps {
//     show: boolean;
//     onHide: () => void;
//     handleSubmit: (
//         instanceId: number | undefined,
//         checkedOptions: any[],
//         isOverrideExistingContactCheckbox?: boolean,
//     ) => void;
//     title: string;
//     message?: string;
//     btn1: string;
//     btn2: string;
//     filterContactsObject: any;
//     selectedContactIds?: any;
//     instanceId: number | undefined;
//     getOptionColor?: (option: any) => string;
//     getOptionName: (option: any) => string;
//     showColorBadge: boolean;
//     setRefreshContacts?: (value: boolean | number) => void;
//     hideSmallInfoMessageInCheck?: boolean;
//     smallInfoMessage?: any;
//     isContactAssigedTeamMemberBirfercationShow?: boolean;
// }

// const ContactAssignCheckBoxModal: React.FC<IContactAssignCheckBoxModalProps> = ({
//     show,
//     onHide,
//     handleSubmit,
//     title,
//     message,
//     btn1,
//     btn2,
//     filterContactsObject,
//     selectedContactIds,
//     instanceId,
//     getOptionColor,
//     getOptionName,
//     showColorBadge,
//     setRefreshContacts,
//     hideSmallInfoMessageInCheck,
//     smallInfoMessage,
//     isContactAssigedTeamMemberBirfercationShow,
// }) => {
//     const [checkedOptions, setCheckedOptions] = useState<any[] | undefined>([]);
//     const [
//         isNotOverrideExistingContactCheckbox,
//         setIsNotOverrideExistingContactCheckbox,
//     ] = useState(true);

//     const [searchText, setSearchText] = useState("");
//     const [debouncedSearch, setDebouncedSearch] = useState("");
//     const [checkedAll, setCheckedAll] = useState<boolean>(false);

//     const [contactList, setContactList] = useState<INearbyContacts[]>([]);
//     const [loading, setLoading] = useState(false);
//     const PAGE_SIZE = 20;
//     const [offset, setOffset] = useState(0);
//     const [hasMore, setHasMore] = useState(true);
//     const [isFetchingMore, setIsFetchingMore] = useState(false);

//     const scrollContainerRef = useRef<HTMLDivElement>(null);

//     useEffect(() => {
//         const fetchContacts = async () => {
//             setOffset(0);
//             setHasMore(true);
//             setContactList([]);
//             setLoading(true);
//             await fetchAllNearbyContacts(
//                 setContactList,
//                 setLoading,
//                 PAGE_SIZE,
//                 0,
//                 false,
//                 filterContactsObject.country_id,
//                 filterContactsObject.state_id,
//                 filterContactsObject.city_id,
//                 filterContactsObject.area_id
//             ).then(
//                 setHasMore,
//             );
//         }

//         fetchContacts();
//     }, [filterContactsObject]);

//     // Infinite scroll
//     useEffect(() => {
//         const container = scrollContainerRef.current;
//         if (!container) return;

//         const handleScroll = () => {
//             const { scrollTop, scrollHeight, clientHeight } = container;
//             if (
//                 scrollTop + clientHeight >= scrollHeight - 60 &&
//                 !isFetchingMore &&
//                 hasMore
//             ) {
//                 const nextOffset = offset + PAGE_SIZE;
//                 setIsFetchingMore(true);
//                 fetchAllNearbyContacts(
//                     setContactList,
//                     setLoading,
//                     PAGE_SIZE,
//                     0,
//                     false,
//                     filterContactsObject.country_id,
//                     filterContactsObject.state_id,
//                     filterContactsObject.city_id,
//                     filterContactsObject.area_id
//                 ).then((more) => {
//                     setOffset(nextOffset);
//                     setHasMore(more);
//                     setIsFetchingMore(false);
//                 });
//             }
//         };
//         container.addEventListener("scroll", handleScroll);
//         return () => container.removeEventListener("scroll", handleScroll);
//     }, [offset, hasMore, isFetchingMore]);

//     useEffect(() => {
//         const timer = setTimeout(() => {
//             if (searchText.length >= 3) {
//                 setDebouncedSearch(searchText.toLowerCase());
//             } else {
//                 setDebouncedSearch("");
//             }
//         }, 300);

//         return () => clearTimeout(timer);
//     }, [searchText]);

//     useEffect(() => {
//         const parsedLabelIds = selectedContactIds
//             ? selectedContactIds.split(",").map(Number)
//             : [];
//         setCheckedOptions(parsedLabelIds);
//     }, [selectedContactIds, instanceId]);

//     const handleCheckboxChange = (optionId: any) => {
//         setCheckedOptions((prev) =>
//             prev?.includes(optionId)
//                 ? prev.filter((id) => id !== optionId)
//                 : [...(prev || []), optionId],
//         );
//     };

//     const handleExistingAssigenTeamMemberCheckboxChange = () => {
//         setIsNotOverrideExistingContactCheckbox(
//             !isNotOverrideExistingContactCheckbox,
//         );
//     };

//     const onSubmit = () => {
//         if (checkedOptions)
//             handleSubmit(
//                 instanceId,
//                 checkedOptions,
//                 isNotOverrideExistingContactCheckbox,
//             );
//         setRefreshContacts && setRefreshContacts(true);
//     };

//     const filteredOptions =
//         debouncedSearch.length >= 3
//             ? contactList.filter((opt) =>
//                 getOptionName(opt)
//                     ?.toLowerCase()
//                     .includes(debouncedSearch)
//             )
//             : contactList;

//     const handleCheckboxAllSelect = () => {
//         setCheckedOptions((prev) => {
//             if ((prev || []) == filteredOptions.map((opt) => opt.id).filter(Boolean)) {
//                 setCheckedAll(false);
//                 return []
//             } else {
//                 setCheckedAll(true);
//                 return filteredOptions.map((opt) => opt.id).filter(Boolean)
//             }
//         })
//     }

//     return show ? (
//         <>
//             <style>
//                 {`
//     .search-wrapper {
//   position: relative;
//   width: 100%;
//   margin-bottom: 10px;
// }

// .search-input-clean {
//   width: 100%;
//   padding: 12px 36px 12px 14px; /* right padding for cross */
//   border-radius: 12px;
//   border: 1px solid #e5e7eb;
//   font-size: 14px;
//   background-color: #f9fafb;
//   outline: none;
//   transition: all 0.25s ease;
// }

// .search-input-clean:focus {
//   border-color: #f97316;
//   background-color: #fff;
//   box-shadow: 0 4px 12px rgba(249, 115, 22, 0.15);
// }

// .clear-icon {
//   position: absolute;
//   right: 12px;
//   top: 50%;
//   transform: translateY(-50%);
//   cursor: pointer;
//   font-size: 14px;
//   color: #9ca3af;
// }

// .clear-icon:hover {
//   color: #111827;
// }
//     `}
//             </style>

//             <div className="modal-overlay" style={{ zIndex: 1111 }}>
//                 <div className="modal-content_label">
//                     <h2 className="modal-title1 form_header_text">{title}</h2>
//                     <div className="search-wrapper">
//                         <input
//                             type="text"
//                             placeholder="Search Labels..."
//                             className="search-input-clean pr-4"
//                             value={searchText}
//                             onChange={(e) => setSearchText(e.target.value)}
//                         />

//                         {searchText && (
//                             <span
//                                 className="clear-icon"
//                                 onClick={() => {
//                                     setSearchText("");
//                                     setDebouncedSearch("");
//                                 }}
//                             >
//                                 <svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#5f6368">
//                                     <path d="m256-200-56-56 224-224-224-224 56-56 224 224 224-224 56 56-224 224 224 224-56 56-224-224-224 224Z" />
//                                 </svg>
//                             </span>
//                         )}
//                     </div>
//                     <div>
//                         <span>
//                             Select All
//                             <span>
//                                 <input
//                                     className="custom-checkbox"
//                                     type="checkbox"
//                                     checked={checkedAll}
//                                     onClick={(e) => {
//                                         e.stopPropagation()
//                                         handleCheckboxAllSelect()
//                                     }}
//                                 />
//                             </span>
//                         </span>
//                     </div>
//                     <div className="overflow-auto " style={{ maxHeight: "500px" }} ref={scrollContainerRef}>
//                         <table className="table table-hover" border={0}>
//                             <tbody className="text-center">
//                                 {filteredOptions.map((option) => (
//                                     <tr
//                                         key={option.id}
//                                         className="text-left"
//                                         style={{
//                                             border: "1px solid white",
//                                             borderCollapse: "collapse",
//                                             height: "10px",
//                                             cursor: "pointer",
//                                         }}
//                                         onClick={() => handleCheckboxChange(option.id)}
//                                     >
//                                         <td className="text-start">
//                                             <label htmlFor={`checkbox-${option.id}`}>
//                                                 {showColorBadge ? (
//                                                     <span
//                                                         style={{
//                                                             backgroundColor: getOptionColor
//                                                                 ? getOptionColor(option)
//                                                                 : "",
//                                                         }}
//                                                         className="badge rounded-pill"
//                                                     >
//                                                         {getOptionName(option)}
//                                                     </span>
//                                                 ) : (
//                                                     <span>{getOptionName(option)}</span> // Just the label text without badge
//                                                 )}
//                                             </label>
//                                         </td>
//                                         <td className="text-end">
//                                             <label htmlFor={`checkbox-${option.id}`}>
//                                                 <input
//                                                     className="custom-checkbox"
//                                                     type="checkbox"
//                                                     id={`checkbox-${option.id}`}
//                                                     checked={checkedOptions?.includes(option.id)}
//                                                     onChange={() => handleCheckboxChange(option.id)}
//                                                     onClick={(e) => e.stopPropagation()}
//                                                 />
//                                             </label>
//                                         </td>
//                                     </tr>
//                                 ))}
//                             </tbody>
//                         </table>
//                     </div>
//                     <div className="d-flex align-items-center">
//                         {hideSmallInfoMessageInCheck && checkedOptions!.length === 0 && (
//                             <InfoMessage text={smallInfoMessage} />
//                         )}
//                     </div>
//                     {isContactAssigedTeamMemberBirfercationShow && (
//                         <div className="d-flex align-items-center">
//                             <input
//                                 type="checkbox"
//                                 style={{ margin: "0 5px 0 0" }}
//                                 checked={isNotOverrideExistingContactCheckbox}
//                                 onChange={handleExistingAssigenTeamMemberCheckboxChange}
//                             />{" "}
//                             <span
//                                 style={{ cursor: "pointer" }}
//                                 onClick={handleExistingAssigenTeamMemberCheckboxChange}
//                             >
//                                 Existing assigned team person will not be overridden.
//                             </span>
//                         </div>
//                     )}
//                     <div className="modal-buttons">
//                         <button className="modal-button1" onClick={onHide}>
//                             {btn1}
//                         </button>
//                         <button
//                             className="modal-button2"
//                             onClick={onSubmit}
//                             style={{ color: "white" }}
//                         >
//                             {btn2}
//                         </button>
//                     </div>
//                 </div>
//             </div>
//         </>
//     ) : null;
// };

// export default ContactAssignCheckBoxModal;
