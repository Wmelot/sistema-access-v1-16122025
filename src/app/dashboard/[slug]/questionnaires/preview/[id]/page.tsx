import { getFormTemplate } from '../../../forms/actions';
import { notFound } from 'next/navigation';
import { QuestionnairePreviewClient } from '../../components/questionnaire-preview-client';

export const dynamic = 'force-dynamic';

interface PageProps {
    params: Promise<{
        slug: string;
        id: string;
    }>;
}

export default async function QuestionnairePreviewPage({ params }: PageProps) {
    const { slug, id } = await params;

    const template = await getFormTemplate(id);

    if (!template) {
        return notFound();
    }

    return (
        <QuestionnairePreviewClient
            template={template}
            slug={slug}
            id={id}
        />
    );
}

