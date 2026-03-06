'use server';

import { redirect } from 'next/navigation';
import { createFormTemplate } from '../actions';

export async function submitCreateForm(formData: FormData) {
    const slug = formData.get('slug') as string;
    const res = await createFormTemplate(formData);
    if (res.success && res.id) {
        redirect(`/dashboard/${slug}/forms/builder/${res.id}`);
    }
}
