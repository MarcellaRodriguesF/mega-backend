import { ApiError } from "../../shared/http/api-error.js";

export interface SourceEvidenceType {
  type: string;
}

export interface SourceRequirement {
  id: string;
  type: string;
  isRequired: boolean;
  order: number;
  configuration: unknown;
  formTemplateId: string | null;
  evidenceTypes: SourceEvidenceType[];
}

export interface SourceActivity {
  id: string;
  name: string;
  description: string | null;
  order: number;
  requirements: SourceRequirement[];
}

export interface SourceStage {
  id: string;
  name: string;
  description: string | null;
  order: number;
  activities: SourceActivity[];
}

export interface SourceTemplate {
  id: string;
  name: string;
  description: string | null;
  status: string;
  stages: SourceStage[];
}

export interface SourceFormField {
  id: string;
  key: string;
  label: string;
  description: string | null;
  type: string;
  placeholder: string | null;
  isRequired: boolean;
  order: number;
  options: unknown;
}

export interface SourceFormTemplate {
  id: string;
  name: string;
  description: string | null;
  status: string;
  fields: SourceFormField[];
}

export interface SnapshotFormField {
  sourceFormFieldId: string;
  key: string;
  label: string;
  description: string | null;
  type: string;
  placeholder: string | null;
  isRequired: boolean;
  order: number;
  options: unknown;
  isSensitive: false;
  connectivityFieldTarget: null;
}

export interface SnapshotForm {
  sourceFormTemplateId: string;
  name: string;
  description: string | null;
  status: string;
  fields: SnapshotFormField[];
}

export interface SnapshotRequirement {
  sourceRequirementId: string;
  type: string;
  isRequired: boolean;
  order: number;
  configuration: unknown;
  sourceFormTemplateId: string | null;
  evidenceTypes: string[];
}

export interface SnapshotActivity {
  sourceActivityId: string;
  name: string;
  description: string | null;
  order: number;
  requirements: SnapshotRequirement[];
}

export interface SnapshotStage {
  sourceStageId: string;
  name: string;
  description: string | null;
  order: number;
  activities: SnapshotActivity[];
}

export interface ImplementationSnapshot {
  templateName: string;
  templateDescription: string | null;
  forms: SnapshotForm[];
  stages: SnapshotStage[];
}

function cloneJson<T>(value: T): T {
  if (value === null || value === undefined) return value;
  return JSON.parse(JSON.stringify(value)) as T;
}

export function listReferencedFormTemplateIds(template: SourceTemplate) {
  const ids = new Set<string>();

  for (const stage of template.stages) {
    for (const activity of stage.activities) {
      for (const requirement of activity.requirements) {
        if (requirement.type !== "FORM") continue;

        if (!requirement.formTemplateId) {
          throw new ApiError(
            "O template possui um requisito de formulário sem formulário associado.",
            422,
            "FORM_SNAPSHOT_SOURCE_MISSING",
          );
        }

        ids.add(requirement.formTemplateId);
      }
    }
  }

  return [...ids];
}

export function buildImplementationSnapshot(
  template: SourceTemplate,
  forms: SourceFormTemplate[],
): ImplementationSnapshot {
  const requiredIds = listReferencedFormTemplateIds(template);
  const formsById = new Map(forms.map((form) => [form.id, form]));
  const missing = requiredIds.filter((id) => !formsById.has(id));

  if (missing.length > 0) {
    throw new ApiError(
      "Não foi possível copiar um formulário associado ao template.",
      422,
      "FORM_SNAPSHOT_SOURCE_MISSING",
    );
  }

  return {
    templateName: template.name,
    templateDescription: template.description,
    forms: requiredIds.map((id) => {
      const form = formsById.get(id)!;

      return {
        sourceFormTemplateId: form.id,
        name: form.name,
        description: form.description,
        status: form.status,
        fields: [...form.fields]
          .sort((left, right) => left.order - right.order)
          .map((field) => ({
            sourceFormFieldId: field.id,
            key: field.key,
            label: field.label,
            description: field.description,
            type: field.type,
            placeholder: field.placeholder,
            isRequired: field.isRequired,
            order: field.order,
            options: cloneJson(field.options),
            isSensitive: false,
            connectivityFieldTarget: null,
          })),
      };
    }),
    stages: [...template.stages]
      .sort((left, right) => left.order - right.order)
      .map((stage) => ({
        sourceStageId: stage.id,
        name: stage.name,
        description: stage.description,
        order: stage.order,
        activities: [...stage.activities]
          .sort((left, right) => left.order - right.order)
          .map((activity) => ({
            sourceActivityId: activity.id,
            name: activity.name,
            description: activity.description,
            order: activity.order,
            requirements: [...activity.requirements]
              .sort((left, right) => left.order - right.order)
              .map((requirement) => ({
                sourceRequirementId: requirement.id,
                type: requirement.type,
                isRequired: requirement.isRequired,
                order: requirement.order,
                configuration: cloneJson(requirement.configuration),
                sourceFormTemplateId:
                  requirement.type === "FORM" ? requirement.formTemplateId : null,
                evidenceTypes: requirement.evidenceTypes.map((item) => item.type),
              })),
          })),
      })),
  };
}
