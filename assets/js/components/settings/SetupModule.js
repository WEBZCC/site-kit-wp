/**
 * SetupModule component.
 *
 * Site Kit by Google, Copyright 2021 Google LLC
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
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { sprintf, __ } from '@wordpress/i18n';
import { useState, useCallback } from '@wordpress/element';

/**
 * Internal dependencies
 */
import Data from 'googlesitekit-data';
import { showErrorNotification } from '../../util';
import ModuleIcon from '../ModuleIcon';
import Spinner from '../Spinner';
import Link from '../Link';
import GenericError from '../legacy-notifications/generic-error';
import ModuleSettingsWarning from '../legacy-notifications/module-settings-warning';
import { CORE_MODULES } from '../../googlesitekit/modules/datastore/constants';
import { CORE_LOCATION } from '../../googlesitekit/datastore/location/constants';
const { useSelect, useDispatch } = Data;

export default function SetupModule( {
	slug,
	name,
	description,
} ) {
	const [ isSaving, setIsSaving ] = useState( false );

	const { activateModule } = useDispatch( CORE_MODULES );
	const { navigateTo } = useDispatch( CORE_LOCATION );

	const onSetup = useCallback( async () => {
		setIsSaving( true );
		const { error, response } = await activateModule( slug );

		if ( ! error ) {
			navigateTo( response.moduleReauthURL );
		} else {
			showErrorNotification( GenericError, {
				id: 'activate-module-error',
				title: __( 'Internal Server Error', 'google-site-kit' ),
				description: error.message,
				format: 'small',
				type: 'win-error',
			} );
			setIsSaving( false );
		}
	}, [ activateModule, navigateTo, slug ] );

	const canActivateModule = useSelect( ( select ) => select( CORE_MODULES ).canActivateModule( slug ) );

	return (
		<div
			className={ classnames(
				'googlesitekit-settings-connect-module',
				`googlesitekit-settings-connect-module--${ slug }`,
				{ 'googlesitekit-settings-connect-module--disabled': ! canActivateModule }
			) }
			key={ slug }
		>
			<div className="googlesitekit-settings-connect-module__switch">
				<Spinner isSaving={ isSaving } />
			</div>
			<div className="googlesitekit-settings-connect-module__logo">
				<ModuleIcon slug={ slug } />
			</div>
			<h3 className="
					googlesitekit-subheading-1
					googlesitekit-settings-connect-module__title
				">
				{ name }
			</h3>
			<p className="googlesitekit-settings-connect-module__text">
				{ description }
			</p>

			<ModuleSettingsWarning slug={ slug } />

			<p className="googlesitekit-settings-connect-module__cta">
				<Link
					onClick={ onSetup }
					href=""
					inherit
					disabled={ ! canActivateModule }
					arrow
				>
					{
						sprintf(
							/* translators: %s: module name */
							__( 'Set up %s', 'google-site-kit' ),
							name
						)
					}
				</Link>
			</p>
		</div>
	);
}

SetupModule.propTypes = {
	slug: PropTypes.string.isRequired,
	name: PropTypes.string.isRequired,
	description: PropTypes.string.isRequired,
};
