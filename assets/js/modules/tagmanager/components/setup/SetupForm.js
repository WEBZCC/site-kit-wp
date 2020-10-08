/**
 * Tag Manager Setup Form component.
 *
 * Site Kit by Google, Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     https://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

/**
 * External dependencies
 */
import PropTypes from 'prop-types';

/**
 * WordPress dependencies
 */
import { Fragment, useEffect, useCallback } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import Data from 'googlesitekit-data';
import { STORE_NAME, FORM_SETUP, EDIT_SCOPE, SETUP_MODE_WITH_ANALYTICS } from '../../datastore/constants';
import { STORE_NAME as MODULES_ANALYTICS } from '../../../analytics/datastore/constants';
import { STORE_NAME as CORE_FORMS } from '../../../../googlesitekit/datastore/forms/constants';
import { STORE_NAME as CORE_USER } from '../../../../googlesitekit/datastore/user/constants';
import { STORE_NAME as CORE_MODULES } from '../../../../googlesitekit/modules/datastore/constants';
import { isPermissionScopeError } from '../../../../util/errors';
import {
	AccountSelect,
	AMPContainerSelect,
	WebContainerSelect,
} from '../common';
import Button from '../../../../components/button';
import Link from '../../../../components/link';
import SetupErrorNotice from './SetupErrorNotice';
import SetupFormInstructions from './SetupFormInstructions';
const { useSelect, useDispatch } = Data;

export default function SetupForm( { finishSetup } ) {
	const canSubmitChanges = useSelect( ( select ) => select( STORE_NAME ).canSubmitChanges() );
	const singleAnalyticsPropertyID = useSelect( ( select ) => select( STORE_NAME ).getSingleAnalyticsPropertyID() );
	const analyticsModuleActive = useSelect( ( select ) => select( CORE_MODULES ).isModuleActive( 'analytics' ) );
	const hasEditScope = useSelect( ( select ) => select( CORE_USER ).hasScope( EDIT_SCOPE ) );
	const analyticsModuleReauthURL = useSelect( ( select ) => select( MODULES_ANALYTICS ).getAdminReauthURL() );
	// Only select the initial autosubmit + submitMode once from form state which will already be set if a snapshot was restored.
	const initialAutoSubmit = useSelect( ( select ) => select( CORE_FORMS ).getValue( FORM_SETUP, 'autoSubmit' ), [] );
	const initialSubmitMode = useSelect( ( select ) => select( CORE_FORMS ).getValue( FORM_SETUP, 'submitMode' ), [] );

	const { setValues } = useDispatch( CORE_FORMS );
	const { activateModule } = useDispatch( CORE_MODULES );
	const { submitChanges } = useDispatch( STORE_NAME );
	const dispatchAnalytics = useDispatch( MODULES_ANALYTICS );
	const submitForm = useCallback( async ( { submitMode } = {} ) => {
		const throwOnError = async ( func ) => {
			const { error } = await func() || {};
			if ( error ) {
				throw error;
			}
		};
		// We'll use form state to persist the chosen submit choice
		// in order to preserve support for auto-submit.
		setValues( FORM_SETUP, { submitMode, submitInProgress: true } );

		try {
			await throwOnError( () => submitChanges() );
			// If submitChanges was successful, disable autoSubmit (in case it was restored).
			setValues( FORM_SETUP, { autoSubmit: false } );

			// If a singular property ID is set in the container(s) and Analytics is active,
			// we disable the snippet output via Analyics to prevent duplicate measurement.
			if ( singleAnalyticsPropertyID && analyticsModuleActive ) {
				dispatchAnalytics.setUseSnippet( false );
				await throwOnError( () => dispatchAnalytics.saveSettings() );
			}

			// If submitting with Analytics setup, and Analytics is not active,
			// activate it, and navigate to its reauth/setup URL to proceed with its setup.
			if ( submitMode === SETUP_MODE_WITH_ANALYTICS && ! analyticsModuleActive ) {
				await throwOnError( () => activateModule( 'analytics' ) );

				finishSetup( analyticsModuleReauthURL );
			} else {
				// If we got here, call finishSetup to navigate to the success screen.
				finishSetup();
			}
		} catch ( err ) {
			if ( isPermissionScopeError( err ) ) {
				setValues( FORM_SETUP, { autoSubmit: true } );
			}
		}
		// Mark the submit as no longer in progress in all cases.
		setValues( FORM_SETUP, { submitInProgress: false } );
	}, [ finishSetup, dispatchAnalytics, singleAnalyticsPropertyID, analyticsModuleActive, analyticsModuleReauthURL ] );

	// If the user lands back on this component with autoSubmit and the edit scope,
	// resubmit the form.
	useEffect( () => {
		if ( initialAutoSubmit && hasEditScope ) {
			submitForm( { submitMode: initialSubmitMode } );
		}
	}, [ hasEditScope, initialAutoSubmit, submitForm, initialSubmitMode ] );

	const isSetupWithAnalytics = !! ( singleAnalyticsPropertyID && ! analyticsModuleActive );

	// Form submit behavior now varies based on which button is clicked.
	// Only the main buttons will trigger the form submit so here we only handle the default action.
	const onSubmit = useCallback( ( event ) => {
		event.preventDefault();
		const submitMode = isSetupWithAnalytics ? SETUP_MODE_WITH_ANALYTICS : '';
		submitForm( { submitMode } );
	}, [ submitForm, isSetupWithAnalytics ] );
	// Click handler for secondary option when setting up with option to include Analytics.
	const onSetupWithoutAnalytics = useCallback( () => submitForm(), [ submitForm ] );

	return (
		<form
			className="googlesitekit-tagmanager-setup__form"
			onSubmit={ onSubmit }
		>
			<SetupErrorNotice />
			<SetupFormInstructions />

			<div className="googlesitekit-setup-module__inputs">
				<AccountSelect />

				<WebContainerSelect />

				<AMPContainerSelect />
			</div>

			<div className="googlesitekit-setup-module__action">
				{ isSetupWithAnalytics && (
					<Fragment>
						<Button disabled={ ! canSubmitChanges }>
							{ __( 'Continue to Analytics setup', 'google-site-kit' ) }
						</Button>
						{ /*
						This "link" below will be rendered as a <button> but should not
						trigger a form submit when clicked, hence the `type="button"`.
						*/ }
						<Link
							className="googlesitekit-setup-module__sub-action"
							type="button"
							onClick={ onSetupWithoutAnalytics }
							disabled={ ! canSubmitChanges }
							inherit
						>
							{ __( 'Complete setup without Analytics', 'google-site-kit' ) }
						</Link>
					</Fragment>
				) }
				{ ! isSetupWithAnalytics && (
					<Button disabled={ ! canSubmitChanges }>
						{ __( 'Confirm & Continue', 'google-site-kit' ) }
					</Button>
				) }
			</div>
		</form>
	);
}

SetupForm.propTypes = {
	finishSetup: PropTypes.func,
};
