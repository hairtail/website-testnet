import clsx from 'clsx'
import { JumioFlowContainer } from 'components/Airdrop/JumioFlowContainer/JumioFlowContainer'
import Button from 'components/Button'
import TextField from 'components/Form/TextField'
import { UNSET } from 'utils/forms'
import { useField, WHITESPACE } from 'hooks/useForm'
import { useState } from 'react'

const publicAddressField = {
  id: 'address',
  label: 'Public Address',
  placeholder: 'Your Iron Fish public address',
  defaultValue: UNSET,
  validation: (address: string) => address.length == 64,
  defaultErrorText: `A 64-character string is required for public address`,
  whitespace: WHITESPACE.BANNED,
}

const confirmAddressField = {
  id: 'confirmAddress',
  label: 'Confirm Public Address',
  placeholder: '',
  defaultValue: UNSET,
  validation: () => true,
  defaultErrorText: `This field must match the public address above`,
  whitespace: WHITESPACE.BANNED,
}

type Props = {
  onNext: (address: string) => void
}

export default function StepSubmitAddress({ onNext }: Props) {
  const pubAddress = useField(publicAddressField)
  const confirmPubAddress = useField(confirmAddressField)
  const [buttonDisabled, setButtonDisabled] = useState(true)

  return (
    <JumioFlowContainer className="flex">
      <div className={clsx('p-6', 'md:p-12', 'flex', 'flex-col')}>
        <h1 className={clsx('font-extended', 'text-4xl', 'mb-8')}>KYC Form</h1>
        <p className="mb-2">
          Please provide the{' '}
          <strong className="underline">public wallet address</strong> of the
          account where you&apos;d like your $IRON airdropped. You can retrieve
          this using
        </p>
        <p className="mb-2">
          <code>ironfish wallet:address</code>
        </p>
        <p>
          Once you begin the KYC process, you will not be able to edit your
          address, so please ensure you are submitting the correct address.
        </p>
        <div className={clsx('flex', 'flex-col')}>
          {pubAddress && <TextField className="max-w-full" {...pubAddress} />}
          {confirmPubAddress && (
            <TextField {...confirmPubAddress} className="max-w-full" />
          )}
        </div>
        <div
          style={{
            marginTop: '1em',
            padding: '.75em',
            backgroundColor: '#eeeeee',
          }}
        >
          <div>
            IMPORTANT: you must have access to this address to receive your
            airdrop. We will not be able to recover lost tokens sent to
            inaccessible accounts. We strongly suggest{' '}
            <a
              className="underline"
              target="_blank"
              href="https://ironfish.network/docs/onboarding/iron-fish-wallet-commands#export-an-account"
              rel="noreferrer"
            >
              exporting your wallet information
            </a>{' '}
            to ensure you always have access.
          </div>
          <div style={{ marginTop: '1em' }}>
            <input
              type="checkbox"
              onClick={() => {
                setButtonDisabled(!buttonDisabled)
              }}
            ></input>{' '}
            I understand, and have exported my account.
          </div>
        </div>

        <div className="mb-auto" />
        <div className={clsx('flex', 'justify-end')}>
          <Button
            onClick={() => {
              if (!pubAddress?.valid) {
                pubAddress?.setValid(false)
              } else if (pubAddress?.value !== confirmPubAddress?.value) {
                confirmPubAddress?.setValid(false)
              } else {
                onNext(pubAddress?.value || '')
              }
            }}
            disabled={buttonDisabled}
          >
            Next
          </Button>
        </div>
      </div>
    </JumioFlowContainer>
  )
}
