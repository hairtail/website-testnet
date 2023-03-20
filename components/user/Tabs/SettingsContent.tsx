import { useState, useCallback } from 'react'
import { useRouter } from 'next/router'

import Note from 'components/Form/Note'
import { FieldError } from 'components/Form/FieldStatus'
import Select from 'components/Form/Select'
import TextField from 'components/Form/TextField'
import Button from 'components/Button'
import Loader from 'components/Loader'

import { useField, WHITESPACE } from 'hooks/useForm'
import {
  UNSET,
  validateEmail,
  validateGraffiti,
  validateGithub,
  defaultErrorText,
} from 'utils/forms'

import { scrollUp } from 'utils/scroll'
import { useQueriedToast } from 'hooks/useToast'
import { STATUS } from 'hooks/useLogin'

import * as API from 'apiClient'
import { TabType } from './index'
import { countries, CountryWithCode } from 'data/countries'

type Props = {
  anyBlocksMined: boolean
  user: API.ApiUser
  authedUser: API.ApiUserMetadata | null
  toast: ReturnType<typeof useQueriedToast>
  reloadUser: () => Promise<boolean>
  setUserStatus: (x: STATUS) => unknown
  setRawMetadata: (x: API.ApiUserMetadata) => unknown
  onTabChange: (tab: TabType) => unknown
  setFetched: (x: boolean) => unknown
  setUser: (x: API.ApiUser) => unknown
}

const FIELDS = {
  email: {
    id: 'email',
    label: 'Email',
    placeholder: 'Your email',
    defaultValue: UNSET,
    validation: validateEmail,
    defaultErrorText: `Valid email address required`,
    whitespace: WHITESPACE.BANNED,
  },
  graffiti: {
    id: 'graffiti',
    label: 'Graffiti',
    placeholder: 'Your tag',
    defaultValue: UNSET,
    validation: validateGraffiti,
    defaultErrorText: `Graffiti is too long`,
    whitespace: WHITESPACE.TRIMMED,
    explanation:
      'A graffiti tag is your Iron Fish username. It is case-sensitive.',
  },
  github: {
    id: 'github',
    label: 'Github',
    required: false,
    placeholder: 'Your github username',
    defaultValue: UNSET,
    validation: validateGithub,
    defaultErrorText: 'Github username is invalid',
    whitespace: WHITESPACE.BANNED,
  },
  social: {
    id: 'social',
    label: '',
    placeholder: 'Your username',
    defaultValue: UNSET,
    required: false,
    validation: () => true,
    defaultErrorText,
    isRadioed: true,
    whitespace: WHITESPACE.BANNED,
    options: [
      { name: 'Discord', value: 'discord' },
      { name: 'Telegram', value: 'telegram' },
    ],
  },
  country: {
    id: 'country',
    label: 'Country',
    defaultValue: UNSET,
    options: countries.map(({ code, name }: CountryWithCode) => ({
      name,
      value: code,
    })),
    validation: (x: string) => x !== UNSET,
    defaultErrorText,
    useDefault: true,
    defaultLabel: 'Select a country',
  },
}

const EDITABLE_FIELDS = {
  email: {
    ...FIELDS.email,
    validation: () => true,
    touched: true,
    controlled: true,
  },
  graffiti: { ...FIELDS.graffiti, controlled: true },
  github: { ...FIELDS.github, controlled: true },
  country: { ...FIELDS.country, useDefault: false, controlled: true },
  discord: {
    ...FIELDS.social,
    required: false,
    options: undefined,
    id: 'discord',
    label: 'Discord',
    placeholder: 'Your Discord username',
    isRadioed: false,
    validation: () => true,
    controlled: true,
  },
  telegram: {
    ...FIELDS.social,
    required: false,
    options: undefined,
    id: 'telegram',
    label: 'Telegram',
    placeholder: 'Your Telegram username',
    isRadioed: false,
    validation: () => true,
    controlled: true,
  },
}

export default function SettingsContent({
  anyBlocksMined,
  user,
  authedUser,
  toast,
  reloadUser,
  onTabChange,
  setFetched,
  setUser,
  setUserStatus,
  setRawMetadata,
}: Props) {
  const router = useRouter()
  const [$error, $setError] = useState<string>(UNSET)
  const [$loading, $setLoading] = useState(false)
  const {
    email: _email = UNSET,
    github: _github = UNSET,
    graffiti: _graffiti = UNSET,
    discord: _discord = UNSET,
    telegram: _telegram = UNSET,
    country_code: _country_code = UNSET,
  } = authedUser || {}

  const $graffiti = useField({
    ...EDITABLE_FIELDS.graffiti,
    defaultValue: _graffiti,
  })
  const $email = useField({
    ...EDITABLE_FIELDS.email,
    defaultValue: _email,
  })
  const $github = useField({
    ...EDITABLE_FIELDS.github,
    defaultValue: _github,
    touched: !!_github,
  })
  const $telegram = useField({
    ...EDITABLE_FIELDS.telegram,
    defaultValue: _telegram,
    touched: !!_telegram,
  })
  const $discord = useField({
    ...EDITABLE_FIELDS.discord,
    defaultValue: _discord,
    touched: !!_discord,
  })

  const $country = useField({
    ...EDITABLE_FIELDS.country,
    defaultValue: _country_code,
    value: _country_code,
  })
  const testInvalid = useCallback(() => {
    const invalid =
      !$email?.valid ||
      !$github?.valid ||
      !$graffiti?.valid ||
      !$discord?.valid ||
      !$telegram?.valid ||
      !$country?.valid
    if (invalid) {
      $setError('Please correct the invalid fields below')
      scrollUp()
    } else {
      $setError(UNSET)
    }
    return invalid
  }, [$email, $github, $graffiti, $telegram, $discord, $country])

  // on save
  const update = useCallback(async () => {
    if (
      !$email ||
      !$graffiti ||
      !$github ||
      !$telegram ||
      !$discord ||
      !$country ||
      !authedUser ||
      testInvalid()
    ) {
      return
    }
    $setLoading(true)
    const email = $email?.value
    const graffiti = $graffiti?.value
    const github = $github?.value
    const telegram = $telegram?.value
    const discord = $discord?.value
    const country = $country?.value

    const updates = {
      email,
      graffiti,
      github,
      telegram,
      discord,
      country_code: country,
    }
    let result
    try {
      result = await API.updateUser(authedUser.id, updates)
    } catch (e) {
      // eslint-disable-next-line no-console
      console.warn(e)
      /*
      Unhandled Runtime Error
      Error: Magic RPC Error: [-32603] Internal error: User denied account access.
      */
      if (e.message.indexOf('-32603') > -1) {
        router.push(`/login?toast=${btoa('Please log in again.')}`)
        return
      }
    }

    const canSee = authedUser && user && user.id === authedUser.id
    if (!canSee) {
      // if you try to go to /users/x/settings but you're not user x
      onTabChange('weekly')
      toast.setMessage('You are not authorized to go there')
      toast.show()
      return
    }
    scrollUp()
    if ('error' in result || 'code' in result) {
      const error = '' + result.message
      $setError(error)
      $setLoading(false)
    } else {
      $setLoading(false)
      setUserStatus(STATUS.LOADING)
      toast.setMessage('User settings updated')
      toast.show()
      // this is to prevent the graffiti from popping an error on save
      $graffiti.setTouched(false)
      const updated = { ...user, ...updates }
      const userData = { ...authedUser, ...updates }
      setUser(updated)
      // $setUserData(userData)
      setFetched(false)
      setRawMetadata(userData)
      return await reloadUser()
    }
  }, [
    onTabChange,
    setRawMetadata,
    setUserStatus,
    $email,
    $github,
    $graffiti,
    $telegram,
    $discord,
    $country,
    authedUser,
    testInvalid,
    toast,
    reloadUser,
    $setError,
    setFetched,
    setUser,
    user,
    router,
  ])

  return (
    <div className="flex">
      <div className="flex-initial">
        {!authedUser?.graffiti ? (
          <Loader />
        ) : (
          <>
            <div className="font-favorit mt-8">User Settings</div>
            {$loading ? (
              <Loader />
            ) : (
              <>
                {$error !== UNSET && (
                  <FieldError text={$error} size="text-md" />
                )}
                {$email && <TextField {...$email} disabled />}
                {$github && <TextField {...$github} />}
                {$graffiti && (
                  <TextField {...$graffiti} disabled={anyBlocksMined} />
                )}
                {anyBlocksMined && (
                  <Note>
                    <>
                      This graffiti has already mined blocks, so it{' '}
                      <strong>cannot be changed.</strong>
                    </>
                  </Note>
                )}
                {$discord && <TextField {...$discord} />}
                {$telegram && <TextField {...$telegram} />}
                {$country && <Select {...$country} />}
                <Button className="mt-8" onClick={update}>
                  Save
                </Button>
              </>
            )}
          </>
        )}
      </div>
    </div>
  )
}
