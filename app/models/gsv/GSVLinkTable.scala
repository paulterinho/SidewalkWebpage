package models.gsv

import models.utils.MyPostgresDriver.api._
import play.api.Play.current

import play.api.Play
import play.api.db.slick.DatabaseConfigProvider
import slick.driver.JdbcProfile
import scala.concurrent.Future

case class GSVLink(gsvPanoramaId: String, targetGsvPanoramaId: String, yawDeg: Double, roadArgb: String, description: String)

class GSVLinkTable(tag: Tag) extends Table[GSVLink](tag, Some("sidewalk"), "gsv_link") {
  def gsvPanoramaId = column[String]("gsv_panorama_id", O.PrimaryKey)
  def targetGsvPanoramaId = column[String]("target_panorama_id")
  def yawDeg = column[Double]("yaw_deg")
  def roadArgb = column[String]("road_argb")
  def description = column[String]("description")

  def * = (gsvPanoramaId, targetGsvPanoramaId, yawDeg, roadArgb, description) <> ((GSVLink.apply _).tupled, GSVLink.unapply)
}

object GSVLinkTable {
  val dbConfig = DatabaseConfigProvider.get[JdbcProfile](Play.current)
  val db = dbConfig.db
  val gsvLinks = TableQuery[GSVLinkTable]

  /**
    * This method checks if the link already exists or not.
    * @param panoramaId Google Street View panorama id
    * @return
    */
  def linkExists(panoramaId: String, targetPanoramaId: String): Boolean = db.withTransaction { implicit session =>
    gsvLinks.list.filter(x => x.gsvPanoramaId == panoramaId && x.targetGsvPanoramaId == targetPanoramaId).nonEmpty
  }

  /**
    * Save a GSVLink object
    * @param link GSVLink object
    * @return
    */
  def save(link: GSVLink): String = db.withTransaction { implicit session =>
    gsvLinks += link
    link.gsvPanoramaId
  }
}