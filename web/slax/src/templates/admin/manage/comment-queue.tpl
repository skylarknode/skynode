<div class="row">
	<div class="col-xs-12">
		<div class="comment-queue panel panel-primary preventSlideout">
			<div class="panel-heading">
				[[admin/manage/comment-queue:comment-queue]]
			</div>

			<!-- IF !comments.length -->
			<p class="panel-body">
				[[admin/manage/comment-queue:description, {config.relative_path}/admin/settings/comment#commenting-restrictions]]
			</p>
			<!-- ENDIF !comments.length -->

			<div class="table-responsive">
				<table class="table table-striped comments-list">
					<thead>
						<tr>
							<th>[[admin/manage/comment-queue:user]]</th>
							<th>[[admin/manage/comment-queue:category]]</th>
							<th>[[admin/manage/comment-queue:title]]</th>
							<th>[[admin/manage/comment-queue:content]] <i class="fa fa-info-circle" data-toggle="tooltip" title="[[admin/manage/comment-queue:content-editable]]"></i></th>
							<th>[[admin/manage/comment-queue:commented]]</th>
							<th></th>
						</tr>
					</thead>
					<tbody>
						<!-- BEGIN comments -->
						<tr data-id="{comments.id}">
							<td class="col-md-1">
								<!-- IF comments.user.userslug -->
								<a href="/uid/{comments.user.uid}">{comments.user.username}</a>
								<!-- ELSE -->
								{comments.user.username}
								<!-- ENDIF comments.user.userslug -->
							</td>
							<td class="col-md-2">
								<a href="{config.relative_path}/category/{comments.category.slug}"><!-- IF comments.categiry.icon --><span class="fa-stack"><i style="color: {comments.category.bgColor};" class="fa fa-circle fa-stack-2x"></i><i style="color: {comments.category.color};" class="fa fa-stack-1x fa-fw {comments.category.icon}"></i></span><!-- ENDIF comments.category.icon --> {comments.category.name}</a>
							</td>
							<td class="col-md-2">
								<!-- IF comments.data.tid -->
								<a href="{config.relative_path}/topic/{comments.data.tid}">[[admin/manage/comment-queue:reply-to, {comments.topic.title}]]</a>
								<!-- ENDIF comments.data.tid -->
								{comments.data.title}
							</td>
							<td class="col-md-5 comment-content">{comments.data.content}</td>
							<td class="col-md-5 comment-content-editable hidden">
								<textarea>{comments.data.rawContent}</textarea>
							</td>
							<td class="col-md-1">
								<span class="timeago" title={comments.data.timestampISO}></span>
							</td>
							<td class="col-md-1">
								<div class="btn-group pull-right">
									<button class="btn btn-success btn-xs" data-action="accept"><i class="fa fa-check"></i></button>
									<button class="btn btn-danger btn-xs" data-action="delete"><i class="fa fa-times"></i></button>
								</div>
							</td>
						</tr>
						<!-- END comments -->
					</tbody>
				</table>
			</div>

			<!-- IMPORT partials/paginator.tpl -->
		</div>
	</div>
</div>