
export type WidgetType = 'text_block' | 'chart_radar' | 'chart_line' | 'table_grid' | 'image_grid' | 'evidence_box' | 'highlight_box' | 'prescription_block';

export interface ReportWidget {
    id: string;
    type: WidgetType;
    title?: string;
    description?: string;
    dataSourcePath?: string; // Path to data in AssessmentData (e.g., "functional.radar")
    config?: Record<string, any>; // Specific config for charts (labels, colors)
    // For Highlight Box
    rules?: {
        field: string;
        condition: '>' | '<' | '==' | '!=';
        value: string | number;
        color: 'red' | 'yellow' | 'green';
        text: string;
    }[];
}

export interface ReportSection {
    id: string;
    title: string;
    layout: 'full_width' | 'two_columns' | 'grid_dashboard';
    widgets: ReportWidget[];
    conditional?: string; // e.g., "region == 'lumbar'"
}

export interface ReportBlueprint {
    id: string;
    name: string;
    version: string;
    sections: ReportSection[];
    globalSettings?: {
        showLogo: boolean;
        showPatientInfo: boolean;
        primaryColor: string;
    };
}

export interface SmartReportInput {
    patientId: string;
    professionalId: string;
    assessmentId: string;
    data: any; // The raw form data
}

export interface GeneratedReport {
    metadata: {
        generatedAt: string;
        blueprintUsed: string;
    };
    patientInfo: any;
    sections: {
        title: string;
        content: any[]; // Renderable components
    }[];
}
