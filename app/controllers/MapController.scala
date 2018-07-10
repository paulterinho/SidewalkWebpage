package controllers

import javax.inject.Inject

import com.mohiva.play.silhouette.api.{ Environment, LogoutEvent, Silhouette }
import com.mohiva.play.silhouette.impl.authenticators.SessionAuthenticator
import controllers.headers.ProvidesHeader
import models.audit.{NewTask, AuditTaskTable}
import models.user.User
import play.api.libs.json.Json
import play.api.mvc.{BodyParsers, Result, RequestHeader}

import scala.concurrent.Future


class MapController @Inject() (implicit val env: Environment[User, SessionAuthenticator])
  extends Silhouette[User, SessionAuthenticator] with ProvidesHeader {

  /**
   * Returns an index page.
 *
   * @return
   */
  def edit = UserAwareAction.async { implicit request =>
    request.identity match {
      case Some(user) =>Future.successful(Ok(views.html.mapEdit("Project Sidewalk", Some(user))))
      case None => Future.successful(Redirect("/anonSignUp?url=/map/edit"))
    }
  }
}
