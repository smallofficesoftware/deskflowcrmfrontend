import { PAGE_ID } from "../../helpers/AppEnum";

export interface IReportSubMenu {
  label: string;
  value: string;
  pageId?: number;
  icon?: string;
  description?: string;
}

export interface IReportMenuGroup {
  menu: string;
  key: string;
  icon: JSX.Element;
  subMenus: IReportSubMenu[];
}

export const reportsMenuData: IReportMenuGroup[] = [
  {
    menu: "CRM",
    key: "CRM",
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        height="24px"
        viewBox="0 -960 960 960"
        width="24px"
        fill="#5f6368"
      >
        <path d="M480-240q-56 0-107 17.5T280-170v10h400v-10q-42-35-93-52.5T480-240Zm129-59q60 21 111 59v-560H240v560q51-38 111-59t129-21q69 0 129 21ZM437.5-497.5Q420-515 420-540t17.5-42.5Q455-600 480-600t42.5 17.5Q540-565 540-540t-17.5 42.5Q505-480 480-480t-42.5-17.5ZM240-80q-33 0-56.5-23.5T160-160v-640q0-33 23.5-56.5T240-880h480q33 0 56.5 23.5T800-800v640q0 33-23.5 56.5T720-80H240Zm339-361q41-41 41-99t-41-99q-41-41-99-41t-99 41q-41 41-41 99t41 99q41 41 99 41t99-41Zm-99-99Z" />
      </svg>
    ),
    subMenus: [
      {
        label: "Contact Book",
        value: "all_contact_report",
        pageId: PAGE_ID.ALLCONTACT_REPORT,
        icon: "person",
        description: "Full list of every contact saved in your CRM.",
      },
      {
        label: "Inquiry",
        value: "all_inquiry_report",
        pageId: PAGE_ID.ALLINQUIRY_REPORT,
        icon: "help",
        description: "Every inquiry raised by contacts, with product & status detail.",
      },
      {
        label: "Quotation",
        value: "quotation",
        pageId: PAGE_ID.QUOTATION_REPORT,
        icon: "description",
        description: "All quotations sent to customers in the selected period.",
      },
      {
        label: "Proforma Invoice",
        value: "proforma_invoice_report",
        pageId: PAGE_ID.PROFORMA_INVOICE_REPORT,
        icon: "receipt",
        description: "Proforma invoices issued ahead of final billing.",
      },
      {
        label: "Orders",
        value: "order",
        pageId: PAGE_ID.ORDER,
        icon: "cart",
        description: "Sales orders placed by customers, order-wise.",
      },
      {
        label: "Field Visits",
        value: "all_visit_report",
        pageId: PAGE_ID.ALLVISIT_REPORT,
        icon: "location",
        description: "Field visits logged by your team, with location and outcome.",
      },
      {
        label: "Call History",
        value: "all_call_report",
        pageId: PAGE_ID.ALLCALL_REPORT,
        icon: "call",
        description: "Call log history against every contact.",
      },
    ],
  },

  {
    menu: "HRMS",
    key: "HRMS",
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        height="24px"
        viewBox="0 -960 960 960"
        width="24px"
        fill="#5f6368"
      >
        <path d="M0-240v-63q0-43 44-70t116-27q13 0 25 .5t23 2.5q-14 21-21 44t-7 48v65H0Zm240 0v-65q0-32 17.5-58.5T307-410q32-20 76.5-30t96.5-10q53 0 97.5 10t76.5 30q32 20 49 46.5t17 58.5v65H240Zm540 0v-65q0-26-6.5-49T754-397q11-2 22.5-2.5t23.5-.5q72 0 116 26.5t44 70.5v63H780Zm-455-80h311q-10-20-55.5-35T480-370q-55 0-100.5 15T325-320ZM160-440q-33 0-56.5-23.5T80-520q0-34 23.5-57t56.5-23q34 0 57 23t23 57q0 33-23 56.5T160-440Zm640 0q-33 0-56.5-23.5T720-520q0-34 23.5-57t56.5-23q34 0 57 23t23 57q0 33-23 56.5T800-440Zm-320-40q-50 0-85-35t-35-85q0-51 35-85.5t85-34.5q51 0 85.5 34.5T600-600q0 50-34.5 85T480-480Zm0-80q17 0 28.5-11.5T520-600q0-17-11.5-28.5T480-640q-17 0-28.5 11.5T440-600q0 17 11.5 28.5T480-560Zm1 240Zm-1-280Z" />
      </svg>
    ),
    subMenus: [
      {
        label: "My Team",
        value: "My_Team_Report",
        pageId: PAGE_ID.TEAM_MEMBER_WITH_ACCESS_RIGHT,
        icon: "group",
        description: "Every team member and their access rights.",
      },
      {
        label: "Expenses",
        value: "team_day_wise_expanse_report",
        pageId: PAGE_ID.TEAMEXPENSE_REPORT,
        icon: "wallet",
        description: "Day-wise expense breakup for each team member.",
      },
      {
        label: "Leave Management",
        value: "LeaveManagement_Report",
        pageId: PAGE_ID.LEAVE,
        icon: "calendarLeave",
        description: "Leave requests and approval status across the team.",
      },
      {
        label: "Attendance & Salary",
        value: "attendance_salary",
        pageId: PAGE_ID.ATTEDANCESALARY_REPORT,
        icon: "clock",
        description: "Attendance days mapped against monthly salary payout.",
      },
      {
        label: "Process Attendance",
        value: "Process_Attendance",
        pageId: PAGE_ID.PROCESS_ATTENDANCE,
        icon: "clock",
        description: "Run and review attendance processing for the period.",
      },
      {
        label: "Attendance Register",
        value: "Attendance_register_Report",
        icon: "today",
        description: "Daily in/out register for every employee.",
      },
      {
        label: "Salary Register",
        value: "Salary_register_Report",
        icon: "payments",
        description: "Monthly salary register with earnings and deductions.",
      },
      {
        label: "Salary Process",
        value: "Salary_Process",
        pageId: PAGE_ID.SALARY_PROCESS,
        icon: "payments",
        description: "Process and finalize salary runs for a period.",
      },
      {
        label: "Compensation Adjustments",
        value: "Compensation_Adjustments",
        pageId: PAGE_ID.COMPENSATION_ADJUSTMENT,
        icon: "tune",
        description: "One-off compensation adjustments applied to employees.",
      },
      {
        label: "Holiday",
        value: "holiday_master",
        pageId: PAGE_ID.HOLIDAY_MASTER,
        icon: "beach",
        description: "Company holiday calendar for the year.",
      },
      {
        label: "Lock Control",
        value: "Lock_Control_master",
        pageId: PAGE_ID.LOCK_CONTROL,
        icon: "lock",
        description: "Periods locked from further attendance/salary edits.",
      },
      {
        label: "Round Off",
        value: "round_off",
        pageId: PAGE_ID.ROUND_OFF,
        icon: "calc",
        description: "Rounding rules applied to salary calculations.",
      },
      {
        label: "Adjustment Type",
        value: "adjustment_type",
        pageId: PAGE_ID.ADJUSTMENT_TYPE,
        icon: "tune",
        description: "Master list of compensation adjustment types.",
      },
      {
        label: "Day Adjustment",
        value: "day_adjustment",
        pageId: PAGE_ID.DAY_ADJUSTMENT,
        icon: "today",
        description: "Manual day-count adjustments for attendance.",
      },
      {
        label: "Employee Day Book",
        value: "Emp_Transaction_Report",
        pageId: PAGE_ID.EMP_ACCOUNT_HISTORY,
        icon: "book",
        description: "Day-by-day transaction history per employee account.",
      },
      {
        label: "Employee Account Outstanding",
        value: "Emp_AccountOutstanding_Report",
        pageId: PAGE_ID.EMP_ACCOUNTOUTSTANDING_REPORT,
        icon: "accountBalance",
        description: "Outstanding balance owed to or by each employee.",
      },
      {
        label: "Expense Detailed Report",
        value: "Expense_Detailed_Report",
        pageId: PAGE_ID.EXPENSE_DETAILED_REPORT,
        icon: "listAlt",
        description: "Line-item detail of every expense claimed.",
      },
    ],
  },

  {
    menu: "Production",
    key: "Production",
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        height="24px"
        viewBox="0 -960 960 960"
        width="24px"
        fill="#5f6368"
      >
        <path d="M756-120 537-339l84-84 219 219-84 84Zm-552 0-84-84 276-276-68-68-28 28-51-51v82l-28 28-121-121 28-28h82l-50-50 142-142q20-20 43-29t47-9q24 0 47 9t43 29l-92 92 50 50-28 28 68 68 90-90q-4-11-6.5-23t-2.5-24q0-59 40.5-99.5T701-841q15 0 28.5 3t27.5 9l-99 99 72 72 99-99q7 14 9.5 27.5T841-701q0 59-40.5 99.5T701-561q-12 0-24-2t-23-7L204-120Z" />
      </svg>
    ),
    subMenus: [
      {
        label: "Work Station",
        value: "Work_Station_Report",
        pageId: PAGE_ID.MACHINE_MANAGEMENTS,
        icon: "factory",
        description: "Machines and work stations set up on the shop floor.",
      },
      {
        label: "Job Card",
        value: "Job_Card_Grid",
        pageId: PAGE_ID.STOCK_ADJUSTMENT,
        icon: "assignment",
        description: "Job cards issued for production runs.",
      },
      {
        label: "Process",
        value: "Process_Report",
        pageId: PAGE_ID.MACHINE_MANAGEMENTS,
        icon: "settingsCog",
        description: "Production process stages and their status.",
      },
      {
        label: "Warehouse",
        value: "Warehouse_Report",
        pageId: PAGE_ID.WAREHOUSE,
        icon: "warehouse",
        description: "Warehouses configured for stock storage.",
      },
      {
        label: "Bill Of Material",
        value: "BillOfMaterial_Report",
        pageId: PAGE_ID.BILL_OF_MATERIALS,
        icon: "inventory",
        description: "BOM structures used for manufacturing products.",
      },
      {
        label: "Stock Adjustment",
        value: "StockAdjustment_Report",
        pageId: PAGE_ID.STOCK_ADJUSTMENT,
        icon: "tune",
        description: "Manual stock quantity adjustments and reasons.",
      },
    ],
  },

  {
    menu: "Account",
    key: "Account",
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        height="24px"
        viewBox="0 -960 960 960"
        width="24px"
        fill="#5f6368"
      >
        <path d="M200-280v-280h80v280h-80Zm240 0v-280h80v280h-80ZM80-120v-80h800v80H80Zm600-160v-280h80v280h-80ZM80-640v-80l400-200 400 200v80H80Zm178-80h444-444Zm0 0h444L480-830 258-720Z" />
      </svg>
    ),
    subMenus: [
      {
        label: "Dispatch",
        value: "dispatch_report",
        pageId: PAGE_ID.DISPATCH_REPORT,
        icon: "truck",
        description: "Shipments dispatched against sales orders.",
      },
      {
        label: "Invoice",
        value: "order_invoice",
        pageId: PAGE_ID.SALESINVOICE_REPORT,
        icon: "receipt",
        description: "All sales invoices raised in the selected period.",
      },
      {
        label: "Account Day Book",
        value: "allaccount_report",
        pageId: PAGE_ID.ALLACCOUNTTRANSCTION_REPORT,
        icon: "swapHoriz",
        description: "Every debit and credit transaction on your accounts.",
      },
      {
        label: "Receivable",
        value: "Receivable",
        pageId: PAGE_ID.ACCOUNTOUTSTANDING_REPORT,
        icon: "arrowDown",
        description: "Outstanding amounts customers still owe you.",
      },
      {
        label: "Payable",
        value: "Payable",
        pageId: PAGE_ID.ACCOUNTOUTSTANDING_REPORT,
        icon: "arrowUp",
        description: "Outstanding amounts you owe to suppliers.",
      },
      {
        label: "GST In",
        value: "GST_In",
        icon: "arrowDown",
        description: "Input GST collected on purchase transactions.",
      },
      {
        label: "GST Out",
        value: "GST_Out",
        icon: "arrowUp",
        description: "Output GST charged on sales transactions.",
      },
      {
        label: "Payment",
        value: "account_debit_report",
        pageId: PAGE_ID.ALLACCOUNTTRANSCTION_REPORT,
        icon: "arrowUp",
        description: "Payments made — debit-side account entries.",
      },
      {
        label: "Receipt",
        value: "account_credit_report",
        pageId: PAGE_ID.ALLACCOUNTTRANSCTION_REPORT,
        icon: "arrowDown",
        description: "Receipts collected — credit-side account entries.",
      },
      {
        label: "Credit Note (Sales Return)",
        value: "return_sales_invoice",
        pageId: PAGE_ID.RETURN_SALES_INVOICE,
        icon: "undo",
        description: "Sales returns / credit notes issued to customers.",
      },
      {
        label: "Debit Note (Purchase Return)",
        value: "return_purchase_invoice",
        pageId: PAGE_ID.RETURN_PURCHASE_INVOICE,
        icon: "undo",
        description: "Purchase returns / debit notes issued to suppliers.",
      },
      {
        label: "Payment Wise Account Report",
        value: "Payment_wise_account_Report",
        icon: "creditCard",
        description: "Transactions grouped by payment method.",
      },
    ],
  },

  {
    menu: "Inventory",
    key: "Inventory",
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        height="24px"
        viewBox="0 -960 960 960"
        width="24px"
        fill="#5f6368"
      >
        <path d="M620-163 450-333l56-56 114 114 226-226 56 56-282 282Zm220-397h-80v-200h-80v120H280v-120h-80v560h240v80H200q-33 0-56.5-23.5T120-200v-560q0-33 23.5-56.5T200-840h167q11-35 43-57.5t70-22.5q40 0 71.5 22.5T594-840h166q33 0 56.5 23.5T840-760v200ZM508.5-771.5Q520-783 520-800t-11.5-28.5Q497-840 480-840t-28.5 11.5Q440-817 440-800t11.5 28.5Q463-760 480-760t28.5-11.5Z" />
      </svg>
    ),
    subMenus: [
      {
        label: "Purchase Order",
        value: "purchase_order",
        pageId: PAGE_ID.PURCHASEORDER_REPORT,
        icon: "shoppingBag",
        description: "Purchase orders raised against your suppliers.",
      },
      {
        label: "GRN",
        value: "inward_report",
        pageId: PAGE_ID.INWARD,
        icon: "moveToInbox",
        description: "Goods received (GRN) against purchase orders.",
      },
      {
        label: "Purchase Invoice",
        value: "purchase_invoice",
        pageId: PAGE_ID.PURCHASEINVOICE_REPORT,
        icon: "receipt",
        description: "Purchase invoices booked from suppliers.",
      },
      {
        label: "Stock Summary",
        value: "product_inventory",
        pageId: PAGE_ID.PRODUCTINVENTORY_REPORT,
        icon: "warehouse",
        description: "Current stock levels and low-stock alerts.",
      },
    ],
  },

  {
    menu: "Settings",
    key: "Settings",
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        height="24px"
        viewBox="0 -960 960 960"
        width="24px"
        fill="#5f6368"
      >
        <path d="m370-80-16-128q-13-5-24.5-12T307-235l-119 50L78-375l103-78q-1-7-1-13.5v-27q0-6.5 1-13.5L78-585l110-190 119 50q11-8 23-15t24-12l16-128h220l16 128q13 5 24.5 12t22.5 15l119-50 110 190-103 78q1 7 1 13.5v27q0 6.5-2 13.5l103 78-110 190-118-50q-11 8-23 15t-24 12L590-80H370Zm70-80h79l14-106q31-8 57.5-23.5T639-327l99 41 39-68-86-65q5-14 7-29.5t2-31.5q0-16-2-31.5t-7-29.5l86-65-39-68-99 42q-22-23-48.5-38.5T533-694l-13-106h-79l-14 106q-31 8-57.5 23.5T321-633l-99-41-39 68 86 64q-5 15-7 30t-2 32q0 16 2 31t7 30l-86 65 39 68 99-42q22 23 48.5 38.5T427-266l13 106Zm42-180q58 0 99-41t41-99q0-58-41-99t-99-41q-59 0-99.5 41T342-480q0 58 40.5 99t99.5 41Zm-2-140Z" />
      </svg>
    ),
    subMenus: [
      {
        label: "Company Profile",
        value: "company_profile",
        icon: "business",
        description: "Your company's profile and business details.",
      },
      {
        label: "Manage Workspaces",
        value: "manage_workspaces",
        icon: "apps",
        description: "Switch between or manage linked company workspaces.",
      },
      {
        label: "Whatsapp Template",
        value: "whatsapp_template",
        icon: "chat",
        description: "WhatsApp message templates approved for use.",
      },
      {
        label: "Miracle Integration",
        value: "miracle_integration",
        icon: "sync",
        description: "Sync configuration for the Miracle accounting integration.",
      },
      {
        label: "Shortcuts",
        value: "shortcut",
        icon: "bolt",
        description: "Keyboard shortcuts configured for faster navigation.",
      },
    ],
  },

  {
    menu: "Masters",
    key: "Masters",
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        height="24px"
        viewBox="0 -960 960 960"
        width="24px"
        fill="#5f6368"
      >
        <path d="M666-440 440-666l226-226 226 226-226 226Zm-546-80v-320h320v320H120Zm400 400v-320h320v320H520Zm-400 0v-320h320v320H120Zm80-480h160v-160H200v160Zm467 48 113-113-113-113-113 113 113 113Zm-67 352h160v-160H600v160Zm-400 0h160v-160H200v160Zm160-400Zm194-65ZM360-360Zm240 0Z" />
      </svg>
    ),
    subMenus: [
      {
        label: "Task Category",
        value: "Task_Category",
        pageId: PAGE_ID.TASK_CATEGORY,
        icon: "category",
        description: "Categories used to classify tasks.",
      },
      {
        label: "Task Template",
        value: "Task_Template",
        pageId: PAGE_ID.TASK_TEMPLATE,
        icon: "description",
        description: "Reusable templates for creating recurring tasks.",
      },
      {
        label: "Source",
        value: "Source_Of_Types",
        pageId: PAGE_ID.SOURCE,
        icon: "route",
        description: "Lead source types used to tag incoming contacts.",
      },
      {
        label: "Label",
        value: "label_report",
        pageId: PAGE_ID.LABEL,
        icon: "label",
        description: "Labels used to tag and organize contacts.",
      },
      {
        label: "Stages & Status",
        value: "Stages_Status_Report",
        pageId: PAGE_ID.STATUS,
        icon: "flag",
        description: "Pipeline stages and statuses used across the CRM.",
      },
      {
        label: "All Countries",
        value: "All_countries_report",
        pageId: PAGE_ID.COUNTRIE,
        icon: "public",
        description: "Master list of countries available for selection.",
      },
      {
        label: "All States",
        value: "States_Report",
        pageId: PAGE_ID.STATES,
        icon: "map",
        description: "Master list of states available for selection.",
      },
      {
        label: "All Cities",
        value: "Cities_Report",
        pageId: PAGE_ID.CITIES,
        icon: "city",
        description: "Master list of cities available for selection.",
      },
      {
        label: "All Areas",
        value: "Areas_Report",
        pageId: PAGE_ID.AREAS,
        icon: "place",
        description: "Master list of areas/localities available for selection.",
      },
      {
        label: "Expense Type",
        value: "Expense_Types_Report",
        pageId: PAGE_ID.EXPENSES,
        icon: "wallet",
        description: "Categories used to classify employee expenses.",
      },
      {
        label: "Department",
        value: "Department_Report",
        pageId: PAGE_ID.DEPARTMENT,
        icon: "corporateFare",
        description: "Departments configured within your organization.",
      },
      {
        label: "Visit Type",
        value: "Visit_Type_Report",
        pageId: PAGE_ID.VISIT,
        icon: "walk",
        description: "Types used to classify field visits.",
      },
      {
        label: "Leave Type",
        value: "Leave_Type_Report",
        pageId: PAGE_ID.LEAVE_TYPE,
        icon: "eventBusy",
        description: "Types of leave available to employees.",
      },
      {
        label: "Payment Type",
        value: "Payment_Type_Report",
        pageId: PAGE_ID.PAYMENT_TYPE,
        icon: "creditCard",
        description: "Payment methods available for transactions.",
      },
      {
        label: "Custom Form Field",
        value: "CustomFieldForm_Report",
        pageId: PAGE_ID.CUSTOM_FORM_FIELD,
        icon: "dynamicForm",
        description: "Custom fields added to your forms.",
      },
    ],
  },

  {
    menu: "Product Settings",
    key: "Product Settings",
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        height="24px"
        viewBox="0 -960 960 960"
        width="24px"
        fill="#5f6368"
      >
        <path d="M841-518v318q0 33-23.5 56.5T761-120H201q-33 0-56.5-23.5T121-200v-318q-23-21-35.5-54t-.5-72l42-136q8-26 28.5-43t47.5-17h556q27 0 47 16.5t29 43.5l42 136q12 39-.5 71T841-518Zm-272-42q27 0 41-18.5t11-41.5l-22-140h-78v148q0 21 14 36.5t34 15.5Zm-180 0q23 0 37.5-15.5T441-612v-148h-78l-22 140q-4 24 10.5 42t37.5 18Zm-178 0q18 0 31.5-13t16.5-33l22-154h-78l-40 134q-6 20 6.5 43t41.5 23Zm540 0q29 0 42-23t6-43l-42-134h-76l22 154q3 20 16.5 33t31.5 13ZM201-200h560v-282q-5 2-6.5 2H751q-27 0-47.5-9T663-518q-18 18-41 28t-49 10q-27 0-50.5-10T481-518q-17 18-39.5 28T393-480q-29 0-52.5-10T299-518q-21 21-41.5 29.5T211-480h-4.5q-2.5 0-5.5-2v282Zm560 0H201h560Z" />
      </svg>
    ),
    subMenus: [
      {
        label: "Product Group",
        value: "Product_Group_Report",
        pageId: PAGE_ID.PRODUCTGROUP,
        icon: "category",
        description: "Groups used to organize your products.",
      },
      {
        label: "Product Category",
        value: "Product_Category_Report",
        pageId: PAGE_ID.CATEGORY,
        icon: "category",
        description: "Categories used to classify your products.",
      },
      {
        label: "Product Unit",
        value: "Product_Unit_Report",
        pageId: PAGE_ID.UNIT_MASTER,
        icon: "straighten",
        description: "Units of measurement used across your products.",
      },
      {
        label: "Products",
        value: "Products_Report",
        pageId: PAGE_ID.PRODUCT,
        icon: "inventory",
        description: "Full catalog of products with pricing and stock.",
      },
      {
        label: "Tax",
        value: "tax_master",
        icon: "percent",
        description: "Tax rates configured for billing.",
      },
      {
        label: "Price List",
        value: "Price_List_Report",
        pageId: PAGE_ID.PRICE_LIST,
        icon: "priceChange",
        description: "Custom price lists set up for different customers.",
      },
    ],
  },

  {
    menu: "Other Tools",
    key: "Others",
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        height="24px"
        viewBox="0 -960 960 960"
        width="24px"
        fill="#5f6368"
      >
        <path d="M686-132 444-376q-20 8-40.5 12t-43.5 4q-100 0-170-70t-70-170q0-36 10-68.5t28-61.5l146 146 72-72-146-146q29-18 61.5-28t68.5-10q100 0 170 70t70 170q0 23-4 43.5T584-516l244 242q12 12 12 29t-12 29l-84 84q-12 12-29 12t-29-12Zm29-85 27-27-256-256q18-20 26-46.5t8-53.5q0-60-38.5-104.5T386-758l74 74q12 12 12 28t-12 28L332-500q-12 12-28 12t-28-12l-74-74q9 57 53.5 95.5T360-440q26 0 52-8t47-25l256 256ZM472-488Z" />
      </svg>
    ),
    subMenus: [
      {
        label: "Tasks",
        value: "alltask_report",
        pageId: PAGE_ID.TASK_MANAGEMENT,
        icon: "checklist",
        description: "Every task created across your team.",
      },
      {
        label: "Reminder",
        value: "allreminder_report",
        pageId: PAGE_ID.REMINDER_REPORT,
        icon: "notifications",
        description: "Reminders set for follow-ups and events.",
      },
      {
        label: "Support Ticket",
        value: "support_ticket_report",
        pageId: PAGE_ID.SUPPORT_TICKET_REPORT,
        icon: "confirmation",
        description: "Customer support tickets and their resolution status.",
      },
      {
        label: "Reviews",
        value: "reviews_report",
        pageId: PAGE_ID.REVIEWS_REPORT,
        icon: "star",
        description: "Customer reviews and ratings collected.",
      },
      {
        label: "Personal Notes",
        value: "PersonalNotes_Report",
        pageId: PAGE_ID.PERSONAL_NOTE,
        icon: "note",
        description: "Personal notes saved by team members.",
      },
      {
        label: "Online Store",
        value: "online_store",
        icon: "storefront",
        description: "Your online store's products and orders.",
      },
      {
        label: "View In Map",
        value: "View_Google_Map",
        icon: "map",
        description: "Plot contacts and visits on a map view.",
      },
      {
        label: "Explore In Google Map",
        value: "Explore_In_GoogleMap",
        icon: "explore",
        description: "Explore nearby contacts and leads on the map.",
      },
      {
        label: "Print QR Code",
        value: "Print_QR_Code",
        icon: "qrCode",
        description: "Generate and print a QR code for quick lead capture.",
      },
      {
        label: "AI Assistant",
        value: "AI_chat_Dashboard",
        pageId: PAGE_ID.AI_ASSISTANT,
        icon: "smartToy",
        description: "Chat with the AI assistant for quick answers.",
      },
      {
        label: "Route Planner",
        value: "route_planner",
        icon: "route",
        description: "Plan and assign visit routes for your team.",
      },
    ],
  },

  {
    menu: "All New Reports",
    key: "new reports",
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        height="24px"
        viewBox="0 -960 960 960"
        width="24px"
        fill="#5f6368"
      >
        <path d="M200-120q-33 0-56.5-23.5T120-200v-560q0-33 23.5-56.5T200-840h168q13-36 43.5-58t68.5-22q38 0 68.5 22t43.5 58h168q33 0 56.5 23.5T840-760v560q0 33-23.5 56.5T760-120H200Zm0-80h560v-560H200v560Zm80-80h280v-80H280v80Zm0-160h400v-80H280v80Zm0-160h400v-80H280v80Zm221.5-198.5Q510-807 510-820t-8.5-21.5Q493-850 480-850t-21.5 8.5Q450-833 450-820t8.5 21.5Q467-790 480-790t21.5-8.5ZM200-200v-560 560Z" />
      </svg>
    ),
    subMenus: [
      {
        label: "Team Performance",
        value: "team_performance",
        pageId: PAGE_ID.TEAMPERFORMANCE_REPORT,
        icon: "leaderboard",
        description: "Compare performance metrics across your team.",
      },
      {
        label: "Team Pending Work",
        value: "pending",
        pageId: PAGE_ID.PENDINGWORK_REPORT,
        icon: "pendingActions",
        description: "Work items still pending per team member.",
      },
      {
        label: "Status Wise Task Or Supp. Ticket Report",
        value: "status_wise_report",
        pageId: PAGE_ID.STATUS_REPORT,
        icon: "flag",
        description: "Tasks and tickets grouped by current status.",
      },
      {
        label: "Product Wise Movement Report",
        value: "product_report",
        pageId: PAGE_ID.PRODUCTMOVEMENT_REPORT,
        icon: "swapVert",
        description: "Stock in/out movement for each product.",
      },
      {
        label: "Product Wise Pending Report",
        value: "product_wise_pending_report",
        pageId: PAGE_ID.PRODUCTPENDING_REPORT,
        icon: "pending",
        description: "Pending order quantities per product.",
      },
      {
        label: "Category Wise Movement Report",
        value: "category_report",
        pageId: PAGE_ID.CATEGORYMOVEMENT_REPORT,
        icon: "swapVert",
        description: "Stock in/out movement rolled up by category.",
      },
      {
        label: "Category Wise Pending Report",
        value: "category_wise_pending_report",
        pageId: PAGE_ID.CATEGORYPENDING_REPORT,
        icon: "pending",
        description: "Pending order quantities rolled up by category.",
      },
      {
        label: "All Deleted Contact Report",
        value: "all_deleted_contact_report",
        pageId: PAGE_ID.ALL_DELETED_CONTACT_REPORT,
        icon: "personOff",
        description: "Contacts that have been deleted from your CRM.",
      },
      {
        label: "Source Wise Statistic Report",
        value: "source_wise_contact_statistic_report",
        pageId: PAGE_ID.SOURCE_REPORT,
        icon: "pieChart",
        description: "Contact counts broken down by lead source.",
      },
      {
        label: "Label Wise Statistic Report",
        value: "label_wise_contact_statistics_report",
        pageId: PAGE_ID.LABEL_REPORT,
        icon: "label",
        description: "Contact counts broken down by label.",
      },
      {
        label: "Pending Order Report",
        value: "pending_order",
        pageId: PAGE_ID.PENDINGSALESORDER_REPORT,
        icon: "pending",
        description: "Sales orders still pending fulfillment.",
      },
      {
        label: "Pending Purchase Order Report",
        value: "pending_purchase",
        pageId: PAGE_ID.PENDINGPURCHASEORDER_REPORT,
        icon: "pending",
        description: "Purchase orders still pending receipt.",
      },
      {
        label: "Chain Wise Contact Report",
        value: "all_contact_chainwise_report",
        pageId: PAGE_ID.CONTACT_CHAIN_WISE_REPORT,
        icon: "accountTree",
        description: "Contacts grouped by their parent-chain relationship.",
      },
      {
        label: "Daily Sales Invoice",
        value: "daily_sales_invoice",
        icon: "today",
        description: "Sales invoices raised, broken down by day.",
      },
    ],
  },
];
