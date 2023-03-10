const { validationResult } = require("express-validator");
const bcrypt = require("bcrypt");
const Jwt = require("jsonwebtoken");
const User = require("../models/User.js");
const Docs = require("../models/docs.models.js");
const { StatusCode } = require("../utils/constants.js");
const { jsonGenerate } = require("../utils/helpers.js");

//* Create Doc
exports.CreateDoc = async (req, res) => {
  const JWT_TOKEN_SECRET = process.env.JWT_TOKEN_SECRET;

  try {
    const result = await Docs.create({
      userId: req.userId,
      title: req.body.title,
      tag: req.body.tag,
      category: req.body.category,
      content: req.body.content,
      docs_URL: req.body.docs_URL,
      creatorsName: req.body.creatorsName,
      creatorsId: req.body.creatorsId,
      creatorsPhoto: req.body.creatorsPhoto,
      isPrivate: req.body.isPrivate,
    });

    if (result) {
      const user = await User.findOneAndUpdate(
        { _id: req.userId },
        {
          $push: { docs: result },
        }
      );
      return res.json(
        jsonGenerate(StatusCode.SUCCESS, "Docs created Succssfully", result)
      );
    }
  } catch (error) {
    return res.json(
      jsonGenerate(
        StatusCode.UNPROCESSABLE_ENTITY,
        "Something went wrong",
        error
      )
    );
  }
};

//* Remove Doc
exports.RemoveDoc = async (req, res) => {
  try {
    const result = await Docs.findOneAndDelete({
      userId: req.userId,
      _id: req.body._id,
    });

    if (result) {
      const user = await User.findOneAndUpdate(
        { _id: req.userId },
        { $pull: { docs: req.body._id } }
      );

      return res.json(jsonGenerate(StatusCode.SUCCESS, "Todo deleted", null));
    }
  } catch (error) {
    return res.json(
      jsonGenerate(StatusCode.UNPROCESSABLE_ENTITY, "Could not delete", null)
    );
  }
};
//* isPrivate post
exports.SetIsPrivateDoc = async (req, res) => {
  try {
    const { _id } = req.body;
    try {
      const list = await Docs.findById(_id);
      if (list.isPrivate == true) {
        await list.updateOne({ isPrivate: false });
        return res.json(jsonGenerate(StatusCode.SUCCESS, "Like Succssfully"));
      } else {
        await list.updateOne({ isPrivate: true });
        return res.json(jsonGenerate(StatusCode.SUCCESS, "UnLike Succssfully"));
      }
    } catch (error) {
      return res.status(500).json("Internal server error ");
    }
  } catch (error) {}
};

//* Like Doc
exports.InteractDoc = async (req, res) => {
  try {
    const { _id, photoURL } = req.body;
    try {
      const post = await Docs.findById(_id);
      if (!post.like.includes(photoURL)) {
        // if (post.dislike.includes(photoURL)) {
        //   await post.updateOne({ $pull: { dislike: photoURL } });
        // }
        await post.updateOne({ $push: { like: photoURL } });

        return res.json(jsonGenerate(StatusCode.SUCCESS, "Like Succssfully"));
      } else {
        await post.updateOne({ $pull: { like: photoURL } });
        return res.json(jsonGenerate(StatusCode.SUCCESS, "UnLike Succssfully"));
      }
    } catch (error) {
      return res.status(500).json("Internal server error ");
    }

    // if (arr) {
    //   const user = await Docs.findOneAndUpdate(
    //     { _id: docs_id },
    //     {
    //       $push: { like: { photoURL } },
    //     }
    //   );
    //   return res.json(jsonGenerate(StatusCode.SUCCESS, "Like Succssfully"));
    // } else {
    //   const user = await Docs.findOneAndUpdate(
    //     { _id: docs_id },
    //     {
    //       $pull: { like: { photoURL } },
    //     }
    //   );
    //   return res.json(jsonGenerate(StatusCode.SUCCESS, "UnLike Succssfully"));
    // }
  } catch (error) {}
};
//*CountView Doc
exports.CountViewDoc = async (req, res) => {
  try {
    const { _id } = req.body;
    const post = await Docs.findById(_id);
    const updatedPost = await Docs.findByIdAndUpdate(
      { _id: _id },
      { view: post.view + 1 },
      { new: true }
    );
    return res.json(jsonGenerate(StatusCode.SUCCESS, "View Succssfully"));
  } catch (error) {
    return res.status(500).json("Internal server error ");
  }
};

//* Get All HIGHLIGHTS ARTICLE
//! hi???n th??? t???t c??? HIGHLIGHTS ARTICLE kh??ng c???n auth
exports.HighLightDoc = async (req, res) => {
  const PAGE_SIZE = 12;
  try {
    var page = req.query.page;
    if (page) {
      page = parseInt(page);
      if (page < 1) page = 1;
      var skip = (page - 1) * PAGE_SIZE;
      Docs.find({
        $and: [
          {
            isPrivate: false,
          },
        ],
      })
        .sort({ view: -1 })
        .skip(skip)
        .limit(PAGE_SIZE)
        .then((data) => {
          res.json(data);
        });
    } else {
      return res.json(
        jsonGenerate(StatusCode.UNPROCESSABLE_ENTITY, "L???i Truy V???n", error)
      );
    }
  } catch (error) {
    return res.json(
      jsonGenerate(StatusCode.UNPROCESSABLE_ENTITY, "Error", error)
    );
  }
};

//* Find one Doc
//! tr??? v??? k???t qu??? 1 doc th??ng qua _id c???a doc kh??ng c???n auth
exports.FindOneDoc = async (req, res) => {
  try {
    // const { doc_id } = req.body;
    const list = await Docs.findById({ _id: req.body._id });

    return res.json(jsonGenerate(StatusCode.SUCCESS, "Data Succssfully", list));
  } catch (error) {
    return res.json(
      jsonGenerate(StatusCode.UNPROCESSABLE_ENTITY, "Error", error)
    );
  }
};

//* Pagination Doc
//! tr??? v??? k???t qu??? theo page kh??ng th??ng qua auth
exports.PaginationDoc = async (req, res) => {
  const PAGE_SIZE = 12;
  try {
    var page = req.query.page;
    var cate = req.query.cate || "";
    
    if (page) {
      page = parseInt(page);
      if (page < 1) page = 1;
      var skip = (page - 1) * PAGE_SIZE;
      if (cate) {
        Docs.find({
          $and: [
            {
              isPrivate: false,
            },
            {
              category: cate,
            },
          ],
        })
          .skip(skip)
          .limit(PAGE_SIZE)
          .then((data) => {
            res.json(data);
          });
      } else {
        Docs.find({
          $and: [
            {
              isPrivate: false,
            },
          ],
        })
          .skip(skip)
          .limit(PAGE_SIZE)
          .then((data) => {
            res.json(data);
          });
      }
    } else {
      return res.json(
        jsonGenerate(StatusCode.UNPROCESSABLE_ENTITY, "L???i Truy V???n", error)
      );
    }
  } catch (error) {
    return res.json(
      jsonGenerate(StatusCode.UNPROCESSABLE_ENTITY, "Error", error)
    );
  }
};

//* Get doc list pagination
//! Tr??? v??? k???t qu??? theo page do user ????ng t???i
exports.DocListForUserId = async (req, res) => {
  const PAGE_SIZE = 12;
  try {
    var page = req.query.page;
    page = parseInt(page);
    if (page) {
      if (page < 1) page = 1;
      var skip = (page - 1) * PAGE_SIZE;
      const infoCreators = await User.findById(req.userId)
        .select("-password")
        .select("-form")
        .select("-uid")
        .select("-posts")
        .select("-blog")
        .exec();
      const count = infoCreators.docs.length;
      const id = infoCreators._id;
      const docsList = await Docs.find({ userId: id })
        .skip(skip)
        .limit(PAGE_SIZE);
      res.json(
        jsonGenerate(StatusCode.SUCCESS, `Docs List for UserId ${id}`, {
          id,
          count,
          infoCreators,
          result: docsList,
        })
      );
    } else {
      return res.json(
        jsonGenerate(StatusCode.UNPROCESSABLE_ENTITY, "L???i Truy V???n", error)
      );
    }
  } catch (error) {
    return res.json(
      jsonGenerate(StatusCode.UNPROCESSABLE_ENTITY, "Error", error)
    );
  }
};

//* Get doc list pagination
//! Tr??? v??? k???t qu??? theo page do user ????ng t???i
exports.ViewDocsList = async (req, res) => {
  const PAGE_SIZE = 12;
  try {
    var page = req.query.page;
    var uid = req.query.uid;
    page = parseInt(page);
    if (page) {
      if (page < 1) page = 1;
      var skip = (page - 1) * PAGE_SIZE;
      const infoCreators = await User.findById({ _id: uid })
        .select("-password")
        .select("-form")
        .select("-uid")
        .exec();
      const count = infoCreators.docs.length;
      const id = infoCreators._id;
      const docsList = await Docs.find({ userId: id })
        .skip(skip)
        .limit(PAGE_SIZE);
      res.json(
        jsonGenerate(StatusCode.SUCCESS, `Docs List for UserId ${id}`, {
          id,
          count,
          infoCreators,
          result: docsList,
        })
      );
    } else {
      return res.json(
        jsonGenerate(StatusCode.UNPROCESSABLE_ENTITY, "L???i Truy V???n", error)
      );
    }
  } catch (error) {
    return res.json(
      jsonGenerate(StatusCode.UNPROCESSABLE_ENTITY, "Error", error)
    );
  }
};