
export interface PipelineStage {
    id: string;
    pipeline_id: string;
    name: string;
    order: number;
    win_probability: number;
    days_until_stale: number;
    is_won_stage: boolean;
    is_lost_stage: boolean;
}

export interface Pipeline {
    id: string;
    name: string;
    is_default: boolean;
    is_active: boolean;
    stages: PipelineStage[];
}
