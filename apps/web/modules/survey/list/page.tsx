import { DEFAULT_LOCALE, SURVEYS_PER_PAGE } from "@/lib/constants";
import { getPublicDomain } from "@/lib/getPublicUrl";
import { getUserLocale } from "@/lib/user/service";
import { getEnvironmentAuth } from "@/modules/environments/lib/utils";
import { TemplateList } from "@/modules/survey/components/template-list";
import { getProjectWithTeamIdsByEnvironmentId } from "@/modules/survey/lib/project";
import { SurveysList } from "@/modules/survey/list/components/survey-list";
import { getSurveyCount } from "@/modules/survey/list/lib/survey";
import { Button } from "@/modules/ui/components/button";
import { PageContentWrapper } from "@/modules/ui/components/page-content-wrapper";
import { PageHeader } from "@/modules/ui/components/page-header";
import { getTranslate } from "@/tolgee/server";
import { PlusIcon } from "lucide-react";
import { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { TTemplateRole } from "@formbricks/types/templates";

export const metadata: Metadata = {
  title: "Your Surveys",
};

interface SurveyTemplateProps {
  params: Promise<{
    environmentId: string;
  }>;
  searchParams: Promise<{
    role?: TTemplateRole;
  }>;
}

export const SurveysPage = async ({
  params: paramsProps,
  searchParams: searchParamsProps,
}: SurveyTemplateProps) => {
  const publicDomain = getPublicDomain();
  const searchParams = await searchParamsProps;
  const params = await paramsProps;
  const t = await getTranslate();

  const project = await getProjectWithTeamIdsByEnvironmentId(params.environmentId);

  if (!project) {
    throw new Error(t("common.project_not_found"));
  }

  const { session, isBilling, environment, isReadOnly } = await getEnvironmentAuth(params.environmentId);

  const prefilledFilters = [project?.config.channel, project.config.industry, searchParams.role ?? null];

  if (isBilling) {
    return redirect(`/environments/${params.environmentId}/settings/billing`);
  }

  const surveyCount = await getSurveyCount(params.environmentId);

  const currentProjectChannel = project.config.channel ?? null;
  const locale = (await getUserLocale(session.user.id)) ?? DEFAULT_LOCALE;
  const CreateSurveyButton = () => {
    return (
      <Button size="sm" asChild>
        <Link href={`/environments/${environment.id}/surveys/templates`}>
          {t("environments.surveys.new_survey")}
          <PlusIcon />
        </Link>
      </Button>
    );
  };

  const projectWithRequiredProps = {
    ...project,
    brandColor: project.styling?.brandColor?.light ?? null,
    highlightBorderColor: null,
  };

  let content;
  if (surveyCount > 0) {
    content = (
      <>
        <PageHeader pageTitle={t("common.surveys")} cta={isReadOnly ? <></> : <CreateSurveyButton />} />
        <SurveysList
          environmentId={environment.id}
          isReadOnly={isReadOnly}
          publicDomain={publicDomain}
          userId={session.user.id}
          surveysPerPage={SURVEYS_PER_PAGE}
          currentProjectChannel={currentProjectChannel}
          locale={locale}
        />
      </>
    );
  } else if (isReadOnly) {
    content = (
      <>
        <h1 className="px-6 text-3xl font-extrabold text-slate-700">
          {t("environments.surveys.no_surveys_created_yet")}
        </h1>

        <h2 className="px-6 text-lg font-medium text-slate-500">
          {t("environments.surveys.read_only_user_not_allowed_to_create_survey_warning")}
        </h2>
      </>
    );
  } else {
    content = (
      <>
        <h1 className="px-6 text-3xl font-extrabold text-slate-700">
          {t("environments.surveys.all_set_time_to_create_first_survey")}
        </h1>
        <TemplateList
          environmentId={environment.id}
          project={projectWithRequiredProps}
          userId={session.user.id}
          prefilledFilters={prefilledFilters}
        />
      </>
    );
  }

  return <PageContentWrapper>{content}</PageContentWrapper>;
};
