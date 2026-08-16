
export interface CloudResource {
  ID: string;
  Name: string;
  Type: string;
  Provider: string;
  Owner: string;
  OwnerEmail?: string;
  Department?: string;
  DayIdle: number;
  Costperday: number;
  Status: string;
  Deadline?: string;
  Environment?: string;
  Description?: string;
}

export interface PreviewData {
  items_to_sweep: number;
  potential_savings: number;
  instances: CloudResource[]; 
}

export interface InstanceSweepSetting {
  selected: boolean;
  createAmi: boolean;
  amiName: string;
  retainEbs: boolean;
}

export interface ScanDryRunResponse {
  message: string;
  items_to_sweep: number;
  potential_savings: number;
  instances: CloudResource[];
  threshold_days: number;
}

export interface SweepResponse {
  message: string;
  items_swept: number;
  saved_cost_daily: number;
  swept_details: string[];
}


export interface ConfirmSweepDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: (selections: {
    instance_id: string;
    create_ami: boolean;
    ami_name: string;
    retain_ebs: boolean;
  }[]) => void;
  loading: boolean;
  previewData: PreviewData | null;
  resources: CloudResource[]; 
}

export interface DeptItem {
  id: number;
  name: string;
}

export interface CreateTeamDialogProps {
  open: boolean;
  onClose: () => void;
  departments: DeptItem[];
  onCreate: (payload: {
    team_name: string;
    contact_email: string;
    department_id: number;
  }) => Promise<void>;
  loading: boolean;
}
export interface PendingInstance {
  instance_id: string;
  instance_name: string;
  owner_email: string;
  deadline_at: string;
}

export interface ManageKpiCardsProps {
  activeCount: number;
  potentialSavings: number;
  actualSavings: number;
  sweptCount: number;
}


export interface TeamItem {
  team_name: string;
  contact_email?: string;
  department: string;
}

export interface LaunchServerDialogProps {
  open: boolean;
  onClose: () => void;
  userRole: string;
  teams: TeamItem[];
  onLaunch: (payload: {
    name: string;
    instance_type: string;
    environment: string;
    lease_days: number;
    team: string;
    description?: string;
  }) => Promise<void>;
  loading: boolean;
  onAddTeamClick: () => void;
}
export interface ResourceTableProps {
  resources: CloudResource[];
  loading: boolean;
  onScanAndSweep: () => void;
  userRole?: string;
  onActionSuccess?: () => void;
  optimizerData?: import('./optimizer').OptimizerSummary | null;
}

export interface SpendingByDeptCardProps {
  resources: CloudResource[];
}