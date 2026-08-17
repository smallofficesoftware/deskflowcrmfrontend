import React, { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { IGoogleSheetsProps } from "../CreateCompanyController";
import { getConfiguredGoogleSheetsColumnList, updateConfiguredGoogleSheetsColumnList } from "./GoogleSheetsColumnConfigController";

interface ColumnMappings {
    [key: string]: string;
}

interface ColumnSequence {
    [key: string]: string;
}

interface SequenceEntry {
    systemCol: string;
    yourCol: string;
    sequence: number;
}
interface IPropsGoogleSheetsColumnConfig {
    show: boolean;
    onHide: () => void;
    RequiredDetail: IGoogleSheetsProps | null;
}
type GoogleSheetsColumnsDD = Record<string, string[]>;
const GoogleSheetsColumnConfigModal = ({ show, onHide, RequiredDetail }: IPropsGoogleSheetsColumnConfig) => {

    useEffect(() => {
        if (!show) return;
    }, [show]);

    const handelClose = () => {
        onHide();
    };

    const [googleSheetsColumns, setGoogleSheetsColumns] = useState<Record<string, any>>({});
    const [columnMappings, setColumnMappings] = useState<ColumnMappings>({});
    const [columnSequence, setColumnSequence] = useState<ColumnSequence>({});
    const [generatedObject, setGeneratedObject] = useState<ColumnMappings | null>(null);
    const [isReload, setReload] = useState(false);

    const handleColumnNameChange = (systemCol: string, value: string): void => {
        const isValid = validateInput(value);
        if (!isValid) {
            setColumnMappings(prev => ({
                ...prev,
                [systemCol]: value
            }));
        } else {
            toast.error(isValid);
        }

    };

    // Handle input change for "Column Seq." column
    const handleSequenceChange = (systemCol: string, value: string): void => {
        const isValid = isNonNegativeInteger(Number(value));
        if (isValid) {
            setColumnSequence(prev => ({
                ...prev,
                [systemCol]: value
            }));
        } else {
            toast.error("Enter Valid Number.")
        }

    };

    function isNonNegativeInteger(num: number): boolean {
        if (num < 0 || num % 1 !== 0) {
            return false;
        }
        return !num.toString().includes('.');
    }

    const handleSubmit = async (): Promise<void> => {
        const allEntries = Object.values(googleSheetsColumns).map(entry => entry[2])
            .filter(systemCol => columnMappings[systemCol] && columnSequence[systemCol])
            .map(systemCol => ({
                systemCol,
                yourCol: columnMappings[systemCol],
                sequence: parseInt(columnSequence[systemCol]) || 999999
            }));

        // Sort by sequence number
        allEntries.sort((a, b) => a.sequence - b.sequence);

        // Build the final object in sequence order
        const result: ColumnMappings = {};
        allEntries.forEach(({ systemCol, yourCol }) => {
            result[systemCol] = yourCol;
        });

        setGeneratedObject(result);


        await updateConfiguredGoogleSheetsColumnList(RequiredDetail?.sheet_type, result, fetchData)
    };


    // Common validation function
    const validateInput = (value: string) => {
        if (value && value.length > 1) {
            // Must start with a letter, and can include letters, numbers, underscore, hyphen, or space
            if (!/^[a-zA-Z][a-zA-Z0-9 _-]*$/.test(String(value))) {
                // return 'Must start with a letter and contain only letters, numbers, spaces, underscores, or hyphens';
                return '';
            }
            if (/[;,]/.test(String(value))) {
                return 'Semicolons and commas are not allowed';
            }
            return '';
        }

    };

    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === "Enter") {
                // Allow Enter to submit the form if the Save Product button is focused
                const activeElement = document.activeElement as HTMLElement;
                if (activeElement?.classList.contains("save-product-button")) {
                    return; // Let the default behavior (form submission) proceed
                }
                event.preventDefault(); // Prevent default Enter behavior for other elements
            }
        };

        if (show) {
            document.addEventListener("keydown", handleKeyDown);
        } else {
            document.removeEventListener("keydown", handleKeyDown);
        }

        return () => {
            document.removeEventListener("keydown", handleKeyDown);
        };
    }, [show]);

    const fetchData = async () => {
        try {
            const googleSheetsColumnsData = await getConfiguredGoogleSheetsColumnList(RequiredDetail?.sheet_type);
            // Use the state setter instead of direct assignment
            setGoogleSheetsColumns(googleSheetsColumnsData || {});

            let EditCustomeColumnValue: Record<string, string> = {};
            let EditCustomeColumnSequence: Record<string, string> = {};

            Object.entries(googleSheetsColumnsData as Record<string, string[]>).forEach(([key, value], i) => {
                EditCustomeColumnValue[value[2]] = value[0] ? value[0] : '';
                EditCustomeColumnSequence[value[2]] = value[0] ? String(i + 1) : '';
            });
            setColumnMappings(EditCustomeColumnValue)
            setColumnSequence(EditCustomeColumnSequence)

        } catch (error) {
            setGoogleSheetsColumns({});
        }
    };

    useEffect(() => {
        if (show || isReload) {
            fetchData();
        }
    }, [show, isReload]);

    return (
        <React.Fragment>
            {show && (

                <div className="modal1 ">
                    <div className="modal-content1">
                        <div className="d-flex align-items-center justify-content-between">
                            <div className="col-8">
                                <h2 className="modal-title1 form_header_text">{RequiredDetail?.title}</h2>
                            </div>
                            <div className="col-4">
                                <span
                                    className="close ms-3 pb-3"
                                    onClick={handelClose}
                                    style={{ cursor: "pointer" }}
                                >
                                    ×
                                </span>
                            </div>
                        </div>
                        <hr />
                        <style>
                            {
                                `
                                .table-container {
                                max-height: 60vh; /* adjust scroll height */
                                overflow-y: auto;
                                border: 1px solid #ddd;
                                }

                                /* Make header fixed */
                                .table-container table {
                                border-collapse: collapse;
                                width: 100%;
                                }

                                .table-container thead th {
                                position: sticky;
                                top: 0;
                                background: #f4f4f4; /* header bg */
                                z-index: 2;
                                }

                                .table-container th,
                                .table-container td {
                                padding: 8px 12px;
                                border: 1px solid #ddd;
                                text-align: left;
                                }
                                `
                            }
                        </style>
                        <div className="table-container mb-1">


                            <table className="table table-scroll">
                                <thead>
                                    <tr>
                                        <th scope="col">#</th>
                                        <th scope="col">System Col.</th>
                                        <th scope="col">Your Col.</th>
                                        <th scope="col">Column Seq.</th>
                                    </tr>
                                </thead>
                                <tbody className="body-half-screen">
                                    {
                                        googleSheetsColumns && (
                                            Object.entries(googleSheetsColumns).map(([k, v], index) => {
                                                return (
                                                    <tr key={v[2]}>
                                                        <th scope="row">{index + 1}</th>
                                                        <td>
                                                            {k}
                                                            {v[1]?.IS_REQUIRED == "1" && <span style={{ color: 'red' }}>*</span>}
                                                        </td>
                                                        <td>
                                                            <input
                                                                type="text"
                                                                className="form-control"
                                                                placeholder="Enter your column name"
                                                                value={columnMappings[v[2]] || ''}
                                                                onChange={(e) => handleColumnNameChange(v[2], e.target.value)}
                                                            />
                                                        </td>
                                                        <td className="border p-2">
                                                            <input
                                                                type="text"
                                                                className="form-control"
                                                                placeholder="Sequence"
                                                                value={columnSequence[v[2]] || ''}
                                                                onChange={(e) => handleSequenceChange(v[2], e.target.value)}
                                                                min="1"
                                                            />
                                                        </td>
                                                    </tr>
                                                )
                                            })
                                        )
                                    }
                                </tbody>
                            </table>
                        </div>
                        <button onClick={handleSubmit} className="btn btn-success">
                            <svg xmlns="http://www.w3.org/2000/svg" height="20px" viewBox="0 -960 960 960" width="20px" fill="#e6f2ed"><path d="M816-672v456q0 29.7-21.15 50.85Q773.7-144 744-144H216q-29.7 0-50.85-21.15Q144-186.3 144-216v-528q0-29.7 21.15-50.85Q186.3-816 216-816h456l144 144Zm-72 30L642-744H216v528h528v-426ZM480-252q45 0 76.5-31.5T588-360q0-45-31.5-76.5T480-468q-45 0-76.5 31.5T372-360q0 45 31.5 76.5T480-252ZM264-552h336v-144H264v144Zm-48-77v413-528 115Z" /></svg> Save</button>
                    </div>
                </div>
            )
            }
        </React.Fragment >
    );
};

export default GoogleSheetsColumnConfigModal;