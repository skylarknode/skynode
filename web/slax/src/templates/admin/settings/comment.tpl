<!-- IMPORT admin/partials/settings/header.tpl -->

<div class="row">
	<div class="col-sm-2 col-xs-12 settings-header">[[admin/settings/comment:sorting]]</div>
	<div class="col-sm-10 col-xs-12">
		<form>
			<div class="form-group">
				<label>[[admin/settings/comment:sorting.comment-default]]</label>
				<select class="form-control" data-field="postCommentSort">
					<option value="oldest_to_newest">[[admin/settings/comment:sorting.oldest-to-newest]]</option>
					<option value="newest_to_oldest">[[admin/settings/comment:sorting.newest-to-oldest]]</option>
					<option value="most_votes">[[admin/settings/comment:sorting.most-votes]]</option>
				</select>
			</div>
		</form>
	</div>
</div>

<div class="row">
	<div class="col-sm-2 col-xs-12 settings-header">[[admin/settings/comment:length]]</div>
	<div class="col-sm-10 col-xs-12">
		<form>
			<div class="row">
				<div class="col-xs-6">
					<div class="form-group">
						<label for="minimumTitleLength">[[admin/settings/comment:restrictions.min-title-length]]</label>
						<input id="minimumTitleLength" type="text" class="form-control" value="3" data-field="minimumTitleLength">
					</div>
					<div class="form-group">
						<label for="maximumTitleLength">[[admin/settings/comment:restrictions.max-title-length]]</label>
						<input id="maximumTitleLength" type="text" class="form-control" value="255" data-field="maximumTitleLength">
					</div>
				</div>
				<div class="col-xs-6">
					<div class="form-group">
						<label for="minimumCommentLength">[[admin/settings/comment:restrictions.min-comment-length]]</label>
						<input id="minimumCommentLength" type="text" class="form-control" value="8" data-field="minimumCommentLength">
					</div>
					<div class="form-group">
						<label for="maximumCommentLength">[[admin/settings/comment:restrictions.max-comment-length]]</label>
						<input id="maximumCommentLength" type="text" class="form-control" value="32767" data-field="maximumCommentLength">
					</div>
				</div>
			</div>
		</form>
	</div>
</div>

<div class="row">
	<div class="col-sm-2 col-xs-12 settings-header">[[admin/settings/comment:restrictions]]</div>
	<div class="col-sm-10 col-xs-12">
		<form>

			<div class="form-group">
				<label for="commentEditDuration">[[admin/settings/comment:restrictions.seconds-edit-after]]</label>
				<input id="commentEditDuration" type="text" class="form-control" value="0" data-field="commentEditDuration">
			</div>
			<div class="form-group">
				<label for="commentDeleteDuration">[[admin/settings/comment:restrictions.seconds-delete-after]]</label>
				<input id="commentDeleteDuration" type="text" class="form-control" value="0" data-field="commentDeleteDuration">
			</div>
			<div class="form-group">
				<label for="preventTopicDeleteAfterReplies">[[admin/settings/comment:restrictions.replies-no-delete]]</label>
				<input id="preventTopicDeleteAfterReplies" type="text" class="form-control" value="0" data-field="preventTopicDeleteAfterReplies">
			</div>

			<div class="form-group">
				<label for="postStaleDays">[[admin/settings/comment:restrictions.days-until-stale]]</label>
				<input id="postStaleDays" type="text" class="form-control" value="60" data-field="postStaleDays">
				<p class="help-block">
					[[admin/settings/comment:restrictions.stale-help]]
				</p>
			</div>
		</form>
	</div>
</div>

<div class="row">
	<div class="col-sm-2 col-xs-12 settings-header">[[admin/settings/comment:restrictions-new]]</div>
	<div class="col-sm-10 col-xs-12">
		<form>
			<div class="row">
				<div class="col-xs-6">
					<div class="form-group">
						<label for="newbieCommentDelay">[[admin/settings/comment:restrictions.seconds-between-new]]</label>
						<input id="newbieCommentDelay" type="text" class="form-control" value="120" data-field="newbieCommentDelay">
					</div>
				</div>
				<div class="col-xs-6">
					<div class="form-group">
					<label for="initialCommentDelay">[[admin/settings/comment:restrictions.seconds-defore-new]]</label>
					<input id="initialCommentDelay" type="text" class="form-control" value="10" data-field="initialCommentDelay">

					</div>
				</div>
			</div>
			<div class="form-group">
				<div class="checkbox">
					<label class="mdl-switch mdl-js-switch mdl-js-ripple-effect">
						<input class="mdl-switch__input" type="checkbox" data-field="commentQueue">
						<span class="mdl-switch__label"><strong>[[admin/settings/comment:restrictions.comment-queue]]</strong></span>
					</label>
				</div>
				<p class="help-block">
					[[admin/settings/comment:restrictions.comment-queue-help]]
				</p>
			</div>

			<div class="form-group">
				<label for="newbieCommentDelayThreshold">[[admin/settings/comment:restrictions.rep-threshold]]</label>
				<input id="newbieCommentDelayThreshold" type="text" class="form-control" value="3" data-field="newbieCommentDelayThreshold">
			</div>
		</form>
	</div>
</div>

<div class="row">
	<div class="col-sm-2 col-xs-12 settings-header">[[admin/settings/comment:timestamp]]</div>
	<div class="col-sm-10 col-xs-12">
		<form>
			<div class="form-group">
				<label for="timeagoCutoff">[[admin/settings/comment:timestamp.cut-off]]</label>
				<input type="number" class="form-control" id="timeagoCutoff" data-field="timeagoCutoff"  />
				<p class="help-block">
					[[admin/settings/comment:timestamp.cut-off-help]]
				</p>
			</div>
		</form>
	</div>
</div>


<div class="row">
	<div class="col-sm-2 col-xs-12 settings-header">[[admin/settings/comment:unread]]</div>
	<div class="col-sm-10 col-xs-12">
		<form>
			<div class="form-group">
				<label for="unreadCutoff">[[admin/settings/comment:unread.cutoff]]</label>
				<input id="unreadCutoff" type="text" class="form-control" value="2" data-field="unreadCutoff">
			</div>
			<div class="form-group">
				<label for="bookmarkthreshold">[[admin/settings/comment:unread.min-track-last]]</label>
				<input id="bookmarkthreshold" type="text" class="form-control" value="5" data-field="bookmarkThreshold">
			</div>
		</form>
	</div>
</div>

<div class="row">
	<div class="col-sm-2 col-xs-12 settings-header">[[admin/settings/comment:recent]]</div>
	<div class="col-sm-10 col-xs-12">
		<form>
			<div class="checkbox">
				<label class="mdl-switch mdl-js-switch mdl-js-ripple-effect">
					<input class="mdl-switch__input" type="checkbox" data-field="disableRecentCategoryFilter">
					<span class="mdl-switch__label"><strong>[[admin/settings/comment:recent.categoryFilter.disable]]</strong></span>
				</label>
			</div>
		</form>
	</div>
</div>

<div class="row">
	<div class="col-sm-2 col-xs-12 settings-header">[[admin/settings/comment:signature]]</div>
	<div class="col-sm-10 col-xs-12">
		<form>
			<div class="checkbox">
				<label class="mdl-switch mdl-js-switch mdl-js-ripple-effect">
					<input class="mdl-switch__input" type="checkbox" data-field="disableSignatures">
					<span class="mdl-switch__label"><strong>[[admin/settings/comment:signature.disable]]</strong></span>
				</label>
			</div>
			<div class="checkbox">
				<label class="mdl-switch mdl-js-switch mdl-js-ripple-effect">
					<input class="mdl-switch__input" type="checkbox" data-field="signatures:disableLinks">
					<span class="mdl-switch__label"><strong>[[admin/settings/comment:signature.no-links]]</strong></span>
				</label>
			</div>
			<div class="checkbox">
				<label class="mdl-switch mdl-js-switch mdl-js-ripple-effect">
					<input class="mdl-switch__input" type="checkbox" data-field="signatures:disableImages">
					<span class="mdl-switch__label"><strong>[[admin/settings/comment:signature.no-images]]</strong></span>
				</label>
			</div>
			<div class="form-group">
				<label>[[admin/settings/comment:signature.max-length]]</label>
				<input type="text" class="form-control" value="255" data-field="maximumSignatureLength">
			</div>
		</form>
	</div>
</div>

<div class="row">
	<div class="col-sm-2 col-xs-12 settings-header">[[admin/settings/comment:composer]]</div>
	<div class="col-sm-10 col-xs-12">
		<form>
			<p>
				[[admin/settings/comment:composer-help]]
			</p>
			<div class="checkbox">
				<label class="mdl-switch mdl-js-switch mdl-js-ripple-effect" for="composer:showHelpTab">
					<input class="mdl-switch__input" type="checkbox" id="composer:showHelpTab" data-field="composer:showHelpTab" checked />
					<span class="mdl-switch__label">[[admin/settings/comment:composer.show-help]]</span>
				</label>
			</div>
			<div class="checkbox">
				<label class="mdl-switch mdl-js-switch mdl-js-ripple-effect" for="composer:allowPluginHelp">
					<input class="mdl-switch__input" type="checkbox" id="composer:allowPluginHelp" data-field="composer:allowPluginHelp" checked />
					<span class="mdl-switch__label">[[admin/settings/comment:composer.enable-plugin-help]]</span>
				</label>
			</div>
			<div class="form-group">
				<label for="composer:customHelpText">[[admin/settings/comment:composer.custom-help]]</label>
				<textarea class="form-control" id="composer:customHelpText" data-field="composer:customHelpText" rows="5"></textarea>
			</div>
			<div class="checkbox">
				<label class="mdl-switch mdl-js-switch mdl-js-ripple-effect" for="enableCommentHistory">
					<input class="mdl-switch__input" type="checkbox" id="enableCommentHistory" data-field="enableCommentHistory" checked />
					<span class="mdl-switch__label">[[admin/settings/comment:enable-comment-history]]</span>
				</label>
			</div>
		</form>
	</div>
</div>

<div class="row">
	<div class="col-sm-2 col-xs-12 settings-header">[[admin/settings/comment:ip-tracking]]</div>
	<div class="col-sm-10 col-xs-12">
		<form>
			<div class="checkbox">
				<label class="mdl-switch mdl-js-switch mdl-js-ripple-effect">
					<input class="mdl-switch__input" type="checkbox" data-field="trackIpPerComment">
					<span class="mdl-switch__label"><strong>[[admin/settings/comment:ip-tracking.each-comment]]</strong></span>
				</label>
			</div>
		</form>
	</div>
</div>
<!-- IMPORT admin/partials/settings/footer.tpl -->