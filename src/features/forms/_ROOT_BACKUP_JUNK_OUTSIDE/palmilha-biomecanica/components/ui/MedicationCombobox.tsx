"use client";

import { ComboboxSelector } from "./ComboboxSelector";
import { MEDICATIONS_DB } from "@/utils/medication-db";

export const MedicationCombobox = ({ value, onChange, autoFocus, onCommit }: { value: string, onChange: (v: string) => void, autoFocus?: boolean, onCommit?: () => void }) => {
    return <ComboboxSelector value={value} onChange={onChange} database={MEDICATIONS_DB} placeholder="Buscar medicamento..." autoFocus={autoFocus} onCommit={onCommit} />;
};
