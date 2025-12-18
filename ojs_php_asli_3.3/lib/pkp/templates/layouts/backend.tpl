{**
 * lib/pkp/templates/layouts/backend.tpl
 *
 * Copyright (c) 2014-2021 Simon Fraser University
 * Copyright (c) 2003-2021 John Willinsky
 * Distributed under the GNU GPL v3. For full terms see the file docs/COPYING.
 *
 * Common site header.
 *}
<!DOCTYPE html>
<html lang="{$currentLocale|replace:"_":"-"}" xml:lang="{$currentLocale|replace:"_":"-"}">
<head>
	<meta http-equiv="Content-Type" content="text/html; charset={$defaultCharset|escape}" />
	<meta name="viewport" content="width=device-width, initial-scale=1.0">
	<title>{title|strip_tags value=$pageTitle}</title>
	{load_header context="backend"}
	{load_stylesheet context="backend"}
	{load_script context="backend"}
</head>
<body class="pkp_page_{$requestedPage|escape|default:"index"} pkp_op_{$requestedOp|escape|default:"index"}" dir="{$currentLocaleLangDir|escape|default:"ltr"}">

	<script type="text/javascript">
		// Initialise JS handler.
		$(function() {ldelim}
			$('body').pkpHandler(
				'$.pkp.controllers.SiteHandler',
				{ldelim}
					{include file="controllers/notification/notificationOptions.tpl"}
				{rdelim});
		{rdelim});
	</script>

	<div id="app" class="app {if $isLoggedInAs} app--isLoggedInAs{/if}">
		<header class="app__header" role="banner">
			{if $availableContexts}
				<dropdown class="app__headerAction app__contexts" v-cloak>
					<template slot="button">
						<icon icon="sitemap"></icon>
						<span class="-screenReader">{translate key="context.contexts"}</span>
					</template>
					<ul>
						{foreach from=$availableContexts item=$availableContext}
							{if !$currentContext || $availableContext->name !== $currentContext->getLocalizedData('name')}
								<li>
									<a href="{$availableContext->url|escape}" class="pkpDropdown__action">
										{$availableContext->name|escape}
									</a>
								</li>
							{/if}
						{/foreach}
					</ul>
				</dropdown>
			{/if}
			{if $currentContext}
				<a class="app__contextTitle" href="{url page="index"}">
					{$currentContext->getLocalizedData('name')|escape}
				</a>
			{elseif $siteTitle}
				<a class="app__contextTitle" href="{$baseUrl}">
					{$siteTitle|escape}
				</a>
			{else}
				<div class="app__contextTitle">
					{translate key="common.software"}
				</div>
			{/if}
			{if $currentUser}
				<div class="app__headerActions" v-cloak>
					{call_hook name="Template::Layout::Backend::HeaderActions"}
					<div class="app__headerAction app__tasks">
						<button ref="tasksButton" @click="openTasks">
							<icon icon="bell-o"></icon>
							<span class="-screenReader">{translate key="common.tasks"}</span>
							<span v-if="unreadTasksCount" class="app__tasksCount">{{ unreadTasksCount }}</span>
						</button>
					</div>
					<dropdown class="app__headerAction app__userNav">
						<template slot="button">
							<icon icon="user-circle-o"></icon>
							{if $isUserLoggedInAs}
								<icon icon="user-circle" class="app__userNav__isLoggedInAsWarning"></icon>
							{/if}
							<span class="-screenReader">{$currentUser->getData('username')}</span>
						</template>
						<nav aria-label="{translate key="common.navigation.user"}">
							{if $supportedLocales|@count > 1}
								<div class="pkpDropdown__section">
									<div class="app__userNav__changeLocale">Change Language</div>
									<ul>
										{foreach from=$supportedLocales item="locale" key="localeKey"}
											<li>
												<a href="{url router=$smarty.const.ROUTE_PAGE page="user" op="setLocale" path=$localeKey}" class="pkpDropdown__action">
													{if $localeKey == $currentLocale}
														<icon icon="check" :inline="true"></icon>
													{/if}
													{$locale|escape}
												</a>
											</li>
										{/foreach}
									</ul>
								</div>
							{/if}
							{if $isUserLoggedInAs}
								<div class="pkpDropdown__section">
									<div class="app__userNav__loggedInAs">
										{translate key="manager.people.signedInAs" username=$currentUser->getData('username')}
										<a href="{url router=$smarty.const.ROUTE_PAGE page="login" op="signOutAsUser"}" class="app__userNav__logOutAs">{translate key="user.logOutAs" username=$currentUser->getData('username')}</a>.
									</div>
								</div>
							{/if}
							<div class="pkpDropdown__section">
								<ul>
									<li v-if="backToDashboardLink">
										<a :href="backToDashboardLink.url" class="pkpDropdown__action">
											{{ backToDashboardLink.name }}
										</a>
									</li>
									<li>
										<a href="{url router=$smarty.const.ROUTE_PAGE page="user" op="profile"}" class="pkpDropdown__action">
											{translate key="user.profile.editProfile"}
										</a>
									</li>
									<li>
										{if $isUserLoggedInAs}
											<a href="{url router=$smarty.const.ROUTE_PAGE page="login" op="signOutAsUser"}" class="pkpDropdown__action">
												{translate key="user.logOutAs" username=$currentUser->getData('username')}
											</a>
										{else}
											<a href="{url router=$smarty.const.ROUTE_PAGE page="login" op="signOut"}" class="pkpDropdown__action">
												{translate key="user.logOut"}
											</a>
										{/if}
									</li>
								</ul>
							</div>
						</nav>
					</dropdown>
				</div>
			{/if}
		</header>

		{* Swap the navigation menu for a back-to-dashboard link when only one item exists *}
		<nav v-if="backToDashboardLink" class="app__returnHeader" aria-label="{translate key="common.navigation.site"}">
			<a class="app__returnHeaderLink" :href="backToDashboardLink.url">
				{{ backToDashboardLabel }}
			</a>
		</nav>

		<div class="app__body">
			{block name="menu"}
				<nav class="app__nav" aria-label="{translate key="common.navigation.site"}">
					<ul>
						<li>
							<a class="app__navItem{if $requestedPage == 'submissions'} app__navItem--isCurrent{/if}" href="{url router=$smarty.const.ROUTE_PAGE page='submissions'}">
								{translate key="navigation.submissions"}
							</a>
						</li>
						<li>
							<a class="app__navItem{if $requestedPage == 'manageIssues'} app__navItem--isCurrent{/if}" href="{url router=$smarty.const.ROUTE_PAGE page='manageIssues'}">
								{translate key="navigation.issues"}
							</a>
						</li>
						<li>
							<a class="app__navItem{if $requestedPage == 'management' && $requestedOp == 'announcements'} app__navItem--isCurrent{/if}" href="{url router=$smarty.const.ROUTE_PAGE page='management' op='announcements'}">
								{translate key="navigation.announcements"}
							</a>
						</li>
						<li class="app__navGroup">
							<div class="app__navItem app__navItem--hasSubmenu">{translate key="manager.settings"}</div>
							<ul>
								<li>
									<a class="app__navItem{if $requestedPage == 'management' && $requestedOp == 'workflow'} app__navItem--isCurrent{/if}" href="{url router=$smarty.const.ROUTE_PAGE page='management' op='workflow'}">
										{translate key="manager.workflow.title"}
									</a>
								</li>
								<li>
									<a class="app__navItem{if $requestedPage == 'management' && $requestedOp == 'distribution'} app__navItem--isCurrent{/if}" href="{url router=$smarty.const.ROUTE_PAGE page='management' op='distribution'}">
										{translate key="manager.distribution.title"}
									</a>
								</li>
								<li>
									<a class="app__navItem{if $requestedPage == 'management' && $requestedOp == 'website'} app__navItem--isCurrent{/if}" href="{url router=$smarty.const.ROUTE_PAGE page='management' op='website'}">
										{translate key="manager.website.title"}
									</a>
								</li>
								<li>
									<a class="app__navItem{if $requestedPage == 'management' && $requestedOp == 'access'} app__navItem--isCurrent{/if}" href="{url router=$smarty.const.ROUTE_PAGE page='management' op='access'}">
										{translate key="manager.access.title"}
									</a>
								</li>
								<li>
									<a class="app__navItem{if $requestedPage == 'management' && $requestedOp == 'context'} app__navItem--isCurrent{/if}" href="{url router=$smarty.const.ROUTE_PAGE page='management' op='context'}">
										{translate key="manager.context"}
									</a>
								</li>
							</ul>
						</li>
						<li>
							<a class="app__navItem{if $requestedPage == 'user' && ($requestedOp == 'roles' || $requestedOp == 'userGroups')} app__navItem--isCurrent{/if}" href="{url router=$smarty.const.ROUTE_PAGE page='user' op='roles'}">
								{translate key="manager.people"}
							</a>
						</li>
						<li>
							<a class="app__navItem{if $requestedPage == 'management' && $requestedOp == 'tools'} app__navItem--isCurrent{/if}" href="{url router=$smarty.const.ROUTE_PAGE page='management' op='tools'}">
								{translate key="manager.tools"}
							</a>
						</li>
						<li class="app__navGroup">
							<div class="app__navItem app__navItem--hasSubmenu">{translate key="stats.stats"}</div>
							<ul>
								<li>
									<a class="app__navItem{if $requestedPage == 'stats' && $requestedOp == 'editorial'} app__navItem--isCurrent{/if}" href="{url router=$smarty.const.ROUTE_PAGE page='stats' op='editorial'}">
										{translate key="stats.editorial"}
									</a>
								</li>
								<li>
									<a class="app__navItem{if $requestedPage == 'stats' && $requestedOp == 'publications'} app__navItem--isCurrent{/if}" href="{url router=$smarty.const.ROUTE_PAGE page='stats' op='publications'}">
										{translate key="stats.publications"}
									</a>
								</li>
								<li>
									<a class="app__navItem{if $requestedPage == 'stats' && $requestedOp == 'users'} app__navItem--isCurrent{/if}" href="{url router=$smarty.const.ROUTE_PAGE page='stats' op='users'}">
										{translate key="stats.users"}
									</a>
								</li>
							</ul>
						</li>
						<li>
							<a class="app__navItem{if $requestedPage == 'admin'} app__navItem--isCurrent{/if}" href="{url router=$smarty.const.ROUTE_PAGE page='admin' op='settings'}">
								{translate key="navigation.admin"}
							</a>
						</li>
					</ul>
				</nav>
			{/block}

			<main class="app__main">
				<div class="app__page{if $pageWidth} app__page--{$pageWidth}{/if}">
					{block name="breadcrumbs"}
						{if $breadcrumbs}
							<nav class="app__breadcrumbs" role="navigation" aria-label="{translate key="navigation.breadcrumbLabel"}">
								<ol>
									{foreach from=$breadcrumbs item="breadcrumb" name="breadcrumbs"}
										<li>
											{if $smarty.foreach.breadcrumbs.last}
												<span aria-current="page">{$breadcrumb.name|escape}</span>
											{else}
												<a href="{$breadcrumb.url|escape}">
													{$breadcrumb.name|escape}
												</a>
												<span class="app__breadcrumbsSeparator" aria-hidden="true">{translate key="navigation.breadcrumbSeparator"}</span>
											{/if}
										</li>
									{/foreach}
								</ol>
							</nav>
						{/if}
					{/block}

					{block name="page"}{/block}

				</div>
			</main>
		</div>
		<div
			aria-live="polite"
			aria-atomic="true"
			class="app__notifications"
			ref="notifications"
			role="status"
		>
			<transition-group name="app__notification">
				<notification v-for="notification in notifications" :key="notification.key" :type="notification.type" :can-dismiss="true" @dismiss="dismissNotification(notification.key)">
					{{ notification.message }}
				</notification>
			</transition-group>
		</div>
	</div>

	<script type="text/javascript">
		pkp.registry.init('app', {$pageComponent|json_encode}, {$state|json_encode});
	</script>

	<script type="text/javascript">
		// Initialize JS handler
		$(function() {ldelim}
			$('#pkpHelpPanel').pkpHandler(
				'$.pkp.controllers.HelpPanelHandler',
				{ldelim}
					helpUrl: {url|json_encode page="help" escape=false},
					helpLocale: '{$currentLocale|substr:0:2}',
				{rdelim}
			);
		{rdelim});
	</script>
	<div id="pkpHelpPanel" class="pkp_help_panel" tabindex="-1">
		<div class="panel">
			<div class="header">
				<a href="#" class="pkpHomeHelpPanel home">
					{translate key="help.toc"}
				</a>
				<a href="#" class="pkpCloseHelpPanel close">
					{translate key="common.close"}
				</a>
			</div>
			<div class="content">
				{include file="common/loadingContainer.tpl"}
			</div>
			<div class="footer">
				<a href="#" class="pkpPreviousHelpPanel previous">
					{translate key="help.previous"}
				</a>
				<a href="#" class="pkpNextHelpPanel next">
					{translate key="help.next"}
				</a>
			</div>
		</div>
	</div>

</body>
</html>
