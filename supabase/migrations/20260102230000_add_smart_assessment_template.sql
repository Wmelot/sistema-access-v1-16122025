INSERT INTO form_templates (id, title, fields, description, is_active)
VALUES (
  'd4c4a6c0-7b2a-4b6e-9c2b-8e1d7f6a5b4c',
  'Avaliação Clínica Inteligente (PBE)',
  '[]'::jsonb,
  'Formulário inteligente com triagem de Red Flags e anamnese direcionada.',
  true
) ON CONFLICT (id) DO NOTHING;
