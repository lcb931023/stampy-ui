import type {LoaderFunction} from '@remix-run/cloudflare'
import type {ShouldReloadFunction} from '@remix-run/react'
import {useLoaderData, Link} from '@remix-run/react'
import {loadInitialQuestions} from '~/server-utils/stampy'
import useQuestionStateInUrl from '~/hooks/useQuestionStateInUrl'
import useRerenderOnResize from '~/hooks/useRerenderOnResize'
import Search from '~/components/search'
import {Question} from '~/routes/questions/$question'
import logoSvg from '~/assets/stampy-logo.svg'
import {Share, Users, Code} from '~/components/icons-generated'
import CopyLink from '~/components/copyLink'
import {useEffect} from 'react'
import {reloadInBackgroundIfNeeded} from '~/server-utils/kv-cache'

export const loader = async ({request}: Parameters<LoaderFunction>[0]) => {
  const isDomainWithLogo = request.url.match(/ui.stampy.ai/)
  const isLogoForcedOff = request.url.match(/noLogo/)
  const isLogoForcedOn = request.url.match(/withLogo/)
  const noLogo = isDomainWithLogo ? !!isLogoForcedOff : !isLogoForcedOn

  let initialQuestionsData
  try {
    initialQuestionsData = await loadInitialQuestions(request)
  } catch (e) {
    console.error(e)
  }
  return {
    noLogo,
    initialQuestionsData,
  }
}

export const unstable_shouldReload: ShouldReloadFunction = () => false

export default function App() {
  const {noLogo, initialQuestionsData} = useLoaderData<ReturnType<typeof loader>>()
  const {data: initialQuestions = [], timestamp} = initialQuestionsData ?? {}

  useEffect(() => {
    if (timestamp) {
      reloadInBackgroundIfNeeded('', timestamp)
    }
  }, [timestamp])

  const {
    questions,
    canonicallyAnsweredQuestionsRef,
    reset,
    toggleQuestion,
    onLazyLoadQuestion,
    selectQuestionByTitle,
  } = useQuestionStateInUrl(noLogo, initialQuestions)

  useRerenderOnResize() // recalculate AutoHeight

  const openQuestionTitles = questions
    .filter(({questionState}) => questionState === '_')
    .map(({title}) => title)

  return (
    <>
      <header className={noLogo ? 'no-logo' : 'with-logo'}>
        {noLogo ? (
          <div className="logo-intro-group">
            <div className="intro">
              Answering questions about
              <h1>
                <a href="https://en.wikipedia.org/wiki/Existential_risk_from_artificial_general_intelligence">
                  AI Safety
                </a>
              </h1>
            </div>
          </div>
        ) : (
          <div className="logo-intro-group">
            <Link to="/" onClick={(e) => reset(e)}>
              <img className="logo simplified-logo" alt="logo" src={logoSvg} />
            </Link>
            <div className="intro">
              <h1>
                Welcome to <span className="highlight">stampy.ai</span>!
              </h1>
              I can answer questions about{' '}
              <a href="https://en.wikipedia.org/wiki/Existential_risk_from_artificial_general_intelligence">
                artificial general intelligence safety
              </a>
            </div>
          </div>
        )}
        <div className="icon-link-group">
          <CopyLink>
            <Share />
            Share link
          </CopyLink>
          <a href="https://stampy.ai/wiki/Get_involved" className="icon-link">
            <Users />
            Get Involved
          </a>
          <a href="https://github.com/StampyAI/stampy-ui" className="icon-link">
            <Code />
            Help Code
          </a>
        </div>
      </header>
      <main>
        <Search
          canonicallyAnsweredQuestionsRef={canonicallyAnsweredQuestionsRef}
          openQuestionTitles={openQuestionTitles}
          onSelect={selectQuestionByTitle}
        />
        {questions.map((questionProps) => (
          <Question
            key={questionProps.pageid}
            questionProps={questionProps}
            onLazyLoadQuestion={onLazyLoadQuestion}
            onToggle={toggleQuestion}
          />
        ))}
      </main>
      <footer>
        <a href="https://stampy.ai/wiki/Stampy">About</a>
        <a href="https://stampy.ai/wiki/Get_involved">Get Involved</a>
        <a href="https://github.com/StampyAI/stampy-ui">Help Code</a>
        <a href="https://stampy.ai/wiki/Discord_invite">Join Discord</a>
        <a href="https://docs.google.com/forms/d/e/1FAIpQLSdT--8lx5F2pAZoRPPkDusA7vUTvKTVnNiAb9U5cqnohDhzHA/viewform">
          Feedback
        </a>
        <a href="https://stampy.ai/wiki/Meta:Copyrights">@ 2022 stampy.ai</a>
      </footer>
    </>
  )
}
