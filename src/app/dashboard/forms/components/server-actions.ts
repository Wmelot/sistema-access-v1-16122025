'use server';

import { redirect } from 'next/navigation';
import { createFormTemplate } from '../actions';

export async function submitCreateForm(formData: FormData) {
    const res = await createFormTemplate(formData);
    if (res.success && res.id) {
        redirect(`/dashboard/forms/builder/${res.id}`);
    }
}
